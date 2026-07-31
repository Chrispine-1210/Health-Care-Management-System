import assert from 'node:assert/strict';
import test from 'node:test';
import type { EmergencyAccessGrant, InsertAuditLog, InsertEmergencyAccessGrant } from '@shared/schema';
import { MemoryStorage } from './memoryStorage';

class FailingAuditStorage extends MemoryStorage {
  lastCreatedGrantId?: string;

  override async createAuditLog(_log: InsertAuditLog): Promise<never> {
    throw new Error('deliberate audit failure');
  }

  override async createEmergencyAccessGrant(grant: InsertEmergencyAccessGrant): Promise<EmergencyAccessGrant> {
    const created = await super.createEmergencyAccessGrant(grant);
    this.lastCreatedGrantId = created.id;
    return created;
  }
}

const audit = (action: string): InsertAuditLog => ({ userId: 'admin-a', action, entityType: 'test' });

test('role assignment rolls back when its audit insert fails', async () => {
  const storage = new FailingAuditStorage();
  await storage.upsertUser({ id: 'user-a', role: 'patient' });
  await assert.rejects(
    storage.assignUserRoleWithAudit('user-a', 'receptionist', 'branch-a', audit('user.role.change')),
    /deliberate audit failure/,
  );
  const user = await storage.getUser('user-a');
  assert.equal(user?.role, 'patient');
  assert.equal(user?.branchId, null);
});

test('prescription review rolls back when its audit insert fails', async () => {
  const storage = new FailingAuditStorage();
  const prescription = await storage.createPrescription({ patientId: 'patient-a', status: 'pending' });
  await assert.rejects(
    storage.reviewPrescriptionWithAudit(prescription.id, 'pending', { status: 'approved', reviewedBy: 'pharmacist-a' }, audit('prescription.review')),
    /deliberate audit failure/,
  );
  const unchanged = await storage.getPrescription(prescription.id);
  assert.equal(unchanged?.status, 'pending');
  assert.equal(unchanged?.reviewedBy, undefined);
});

test('payment-state update rolls back when its audit insert fails', async () => {
  const storage = new FailingAuditStorage();
  const order = await storage.createOrder({ customerId: 'patient-a', branchId: 'branch-a', subtotal: '10', total: '10', paymentStatus: 'pending' });
  await assert.rejects(
    storage.updateOrderWithAudit(order.id, { paymentStatus: 'completed' }, audit('payment.confirmed')),
    /deliberate audit failure/,
  );
  assert.equal((await storage.getOrder(order.id))?.paymentStatus, 'pending');
});

test('order creation rolls back order and items when its audit insert fails', async () => {
  const storage = new FailingAuditStorage();
  await assert.rejects(
    storage.createOrderWithItemsAndAudit(
      { customerId: 'patient-a', branchId: 'branch-a', subtotal: '10', total: '10' },
      [{ productId: 'product-a', quantity: 1, unitPrice: '10', subtotal: '10' }],
      audit('order.created'),
    ),
    /deliberate audit failure/,
  );
  assert.deepEqual(await storage.getOrdersByCustomer('patient-a'), []);
});

test('emergency-access activation fails when its audit insert fails', async () => {
  const storage = new FailingAuditStorage();
  await assert.rejects(
    storage.createEmergencyAccessGrantWithAudit({
      actorId: 'doctor-a',
      patientId: 'patient-a',
      reasonCode: 'immediate_threat',
      justification: 'Immediate intervention is required for the patient.',
      activatedAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date('2026-01-01T00:05:00.000Z'),
      reviewState: 'pending',
    }, audit('emergency_access.activated')),
    /deliberate audit failure/,
  );
  assert.ok(storage.lastCreatedGrantId);
  assert.equal(await storage.getEmergencyAccessGrant(storage.lastCreatedGrantId), undefined);
});

test('emergency-access review rolls back when its audit insert fails', async () => {
  const storage = new FailingAuditStorage();
  const grant = await storage.createEmergencyAccessGrant({
    actorId: 'doctor-a',
    patientId: 'patient-a',
    reasonCode: 'continuity_of_care',
    justification: 'Urgent continuity of care requires temporary access.',
    activatedAt: new Date('2026-01-01T00:00:00.000Z'),
    expiresAt: new Date('2026-01-01T00:15:00.000Z'),
    reviewState: 'pending',
  });
  await assert.rejects(
    storage.reviewEmergencyAccessGrantWithAudit(grant.id, {
      reviewState: 'rejected',
      reviewedBy: 'security-admin',
      reviewedAt: new Date('2026-01-01T00:01:00.000Z'),
      reviewNotes: 'The incident record did not justify access.',
    }, audit('emergency_access.rejected')),
    /deliberate audit failure/,
  );
  assert.equal((await storage.getEmergencyAccessGrant(grant.id))?.reviewState, 'pending');
});

test('appointment update rolls back when its audit insert fails', async () => {
  const storage = new FailingAuditStorage();
  const appointment = await storage.createAppointment({
    patientId: 'patient-a',
    scheduledAt: new Date('2026-01-02T09:00:00.000Z'),
    type: 'in-person',
    status: 'scheduled',
  });
  await assert.rejects(
    storage.updateAppointmentWithAudit(appointment.id, { status: 'cancelled' }, audit('appointment.cancelled')),
    /deliberate audit failure/,
  );
  assert.equal((await storage.getAppointment(appointment.id))?.status, 'scheduled');
});

test('stale prescription review cannot overwrite a completed transition', async () => {
  const storage = new MemoryStorage();
  const prescription = await storage.createPrescription({ patientId: 'patient-a', status: 'pending' });
  const approved = await storage.reviewPrescriptionWithAudit(
    prescription.id,
    'pending',
    { status: 'approved' },
    audit('prescription.approved'),
  );
  assert.equal(approved?.status, 'approved');

  const staleReview = await storage.reviewPrescriptionWithAudit(
    prescription.id,
    'pending',
    { status: 'rejected' },
    audit('prescription.rejected'),
  );
  assert.equal(staleReview, undefined);
  assert.equal((await storage.getPrescription(prescription.id))?.status, 'approved');
  assert.deepEqual((await storage.getAuditLogs()).map((entry) => entry.action), ['prescription.approved']);
});

test('successful transactional mutations append audit entries', async () => {
  const storage = new MemoryStorage();
  await storage.upsertUser({ id: 'user-a', role: 'patient' });
  const prescription = await storage.createPrescription({ patientId: 'patient-a', status: 'pending' });
  const createdOrder = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', subtotal: '10', total: '10' },
    [{ productId: 'product-a', quantity: 1, unitPrice: '10', subtotal: '10' }],
    audit('order.created'),
  );
  await storage.assignUserRoleWithAudit('user-a', 'receptionist', 'branch-a', audit('user.role.change'));
  await storage.reviewPrescriptionWithAudit(prescription.id, 'pending', { status: 'approved' }, audit('prescription.review'));
  const logs = await storage.getAuditLogs();
  assert.equal((await storage.getOrderItems(createdOrder.order.id)).length, 1);
  assert.equal(logs.find((entry) => entry.action === 'order.created')?.entityId, createdOrder.order.id);
  assert.deepEqual(logs.map((entry) => entry.action).sort(), ['order.created', 'prescription.review', 'user.role.change']);
});
