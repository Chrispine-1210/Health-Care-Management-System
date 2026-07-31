import assert from 'node:assert/strict';
import test from 'node:test';
import type { EmergencyAccessGrant, InsertAuditLog, InsertEmergencyAccessGrant } from '@shared/schema';
import { MemoryStorage } from './memoryStorage';

class FailingAuditStorage extends MemoryStorage {
  lastCreatedGrantId?: string;
  failAudit = true;

  override async createAuditLog(log: InsertAuditLog) {
    if (this.failAudit) throw new Error('deliberate audit failure');
    return super.createAuditLog(log);
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
  const batch = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  await assert.rejects(
    storage.createOrderWithItemsAndAudit(
      { customerId: 'patient-a', branchId: 'branch-a', subtotal: '10', total: '10' },
      [{ productId: 'product-a', quantity: 1, unitPrice: '10', subtotal: '10' }],
      audit('order.created'),
    ),
    /deliberate audit failure/,
  );
  assert.deepEqual(await storage.getOrdersByCustomer('patient-a'), []);
  assert.equal((await storage.getStockBatchesByProduct('product-a'))[0].quantityReserved, 0);
  assert.deepEqual(await storage.getStockMovements({ batchId: batch.id }), []);
});

test('stock receipt and adjustment roll back when audit insertion fails', async () => {
  const storage = new FailingAuditStorage();
  await assert.rejects(
    storage.createStockBatchWithAudit({
      productId: 'product-a', branchId: 'branch-a', batchNumber: 'RECEIPT', quantityOnHand: 5,
      expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
    }, audit('stock.received')),
    /deliberate audit failure/,
  );
  assert.deepEqual(await storage.getStockBatchesByProduct('product-a'), []);
  assert.deepEqual(await storage.getStockMovements(), []);

  const batch = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'ADJUST', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  await assert.rejects(
    storage.adjustStockBatchWithAudit(batch.id, 'branch-a', -2, 'Damaged during handling', audit('stock.adjusted')),
    /deliberate audit failure/,
  );
  assert.equal((await storage.getStockBatchesByProduct('product-a'))[0].quantityOnHand, 5);
  assert.deepEqual(await storage.getStockMovements(), []);
});

test('stock adjustments require branch ownership, preserve nonnegative balances, and append evidence', async () => {
  const storage = new MemoryStorage();
  const batch = await storage.createStockBatchWithAudit({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  }, audit('stock.received'));

  assert.equal(await storage.adjustStockBatchWithAudit(batch.id, 'branch-b', -1, 'Physical count correction', audit('stock.adjusted')), undefined);
  await assert.rejects(
    storage.adjustStockBatchWithAudit(batch.id, 'branch-a', -6, 'Physical count correction', audit('stock.adjusted')),
    /invalid balance/,
  );
  const adjusted = await storage.adjustStockBatchWithAudit(batch.id, 'branch-a', -2, 'Physical count correction', audit('stock.adjusted'));
  assert.equal(adjusted?.quantityOnHand, 3);
  assert.deepEqual((await storage.getStockMovements({ batchId: batch.id }))
    .map((movement) => [movement.movementType, movement.quantityDelta, movement.balanceAfter] as const)
    .sort(([left], [right]) => left.localeCompare(right)), [
    ['adjustment', -2, 3],
    ['receipt', 5, 5],
  ]);
  assert.deepEqual((await storage.getAuditLogs()).map((entry) => entry.action).sort(), ['stock.adjusted', 'stock.received']);
});

test('order reservation uses FEFO batches and records immutable movement balances', async () => {
  const storage = new MemoryStorage();
  const later = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'LATER', quantityOnHand: 5,
    expiryDate: new Date('2031-01-01T00:00:00.000Z'), costPrice: '5',
  });
  const earlier = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'EARLIER', quantityOnHand: 2,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  const created = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', subtotal: '40', total: '40' },
    [{ productId: 'product-a', quantity: 4, unitPrice: '10', subtotal: '40' }],
    audit('order.created'),
  );

  assert.deepEqual(created.items.map((item) => [item.batchId, item.quantity]), [[earlier.id, 2], [later.id, 2]]);
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((batch) => batch.id === earlier.id)?.quantityReserved, 2);
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((batch) => batch.id === later.id)?.quantityReserved, 2);
  assert.deepEqual((await storage.getStockMovements()).map((movement) => movement.balanceAfter).sort(), [0, 3]);
});

test('insufficient eligible stock rolls back reservations and rejects quarantined batches', async () => {
  const storage = new MemoryStorage();
  const active = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'ACTIVE', quantityOnHand: 2,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'QUARANTINED', quantityOnHand: 100,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5', status: 'quarantined',
  });

  await assert.rejects(
    storage.createOrderWithItemsAndAudit(
      { customerId: 'patient-a', branchId: 'branch-a', subtotal: '30', total: '30' },
      [{ productId: 'product-a', quantity: 3, unitPrice: '10', subtotal: '30' }],
      audit('order.created'),
    ),
    /Insufficient eligible stock/,
  );
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((batch) => batch.id === active.id)?.quantityReserved, 0);
  assert.deepEqual(await storage.getStockMovements(), []);
  assert.deepEqual(await storage.getOrdersByCustomer('patient-a'), []);
});

test('order cancellation releases reservations without changing physical stock and is idempotent', async () => {
  const storage = new MemoryStorage();
  const batch = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  const created = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', subtotal: '20', total: '20' },
    [{ productId: 'product-a', quantity: 2, unitPrice: '10', subtotal: '20' }],
    audit('order.created'),
  );
  const cancellationInput = {
    orderId: created.order.id, actorId: 'patient-a', reasonCode: 'CUSTOMER_REQUEST',
    reason: 'Customer requested cancellation before dispensing.', idempotencyKey: 'cancel-order-key-001', correlationId: 'request-001',
  };
  const cancelled = await storage.cancelOrderWithAudit(cancellationInput, audit('order.cancelled'));
  assert.equal(cancelled.order.status, 'cancelled');
  assert.equal(cancelled.releasedReservations[0].quantityReleased, 2);
  const after = (await storage.getStockBatchesByProduct('product-a')).find((item) => item.id === batch.id);
  assert.equal(after?.quantityOnHand, 5);
  assert.equal(after?.quantityReserved, 0);
  const movementCount = (await storage.getStockMovements({ batchId: batch.id })).length;

  const replay = await storage.cancelOrderWithAudit(cancellationInput, audit('order.cancelled'));
  assert.equal(replay.idempotentReplay, true);
  assert.equal((await storage.getStockMovements({ batchId: batch.id })).length, movementCount);
  await assert.rejects(
    storage.cancelOrderWithAudit({ ...cancellationInput, idempotencyKey: 'different-retry-key' }, audit('order.cancelled')),
    /already been cancelled/,
  );
});

test('cancellation rejects terminal orders and rolls back releases when audit insertion fails', async () => {
  const terminalStorage = new MemoryStorage();
  const delivered = await terminalStorage.createOrder({ customerId: 'patient-a', branchId: 'branch-a', subtotal: '10', total: '10', status: 'delivered' });
  await assert.rejects(
    terminalStorage.cancelOrderWithAudit({
      orderId: delivered.id, actorId: 'patient-a', reasonCode: 'CUSTOMER_REQUEST', reason: 'Customer requested cancellation.', idempotencyKey: 'terminal-key-001',
    }, audit('order.cancelled')),
    /cannot be cancelled/,
  );

  const storage = new FailingAuditStorage();
  const batch = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  storage.failAudit = false;
  const created = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', subtotal: '20', total: '20' },
    [{ productId: 'product-a', quantity: 2, unitPrice: '10', subtotal: '20' }],
    { userId: 'patient-a', action: 'seed.order', entityType: 'order' },
  );
  storage.failAudit = true;
  await assert.rejects(
    storage.cancelOrderWithAudit({
      orderId: created.order.id, actorId: 'patient-a', reasonCode: 'CUSTOMER_REQUEST',
      reason: 'Customer requested cancellation before dispensing.', idempotencyKey: 'rollback-key-001',
    }, audit('order.cancelled')),
    /deliberate audit failure/,
  );
  assert.equal((await storage.getOrder(created.order.id))?.status, 'pending');
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((item) => item.id === batch.id)?.quantityReserved, 2);
  assert.equal((await storage.getReservationsByOrder(created.order.id))[0].quantityReleased, 0);
  assert.equal((await storage.getStockMovements({ batchId: batch.id })).filter((movement) => movement.movementType === 'release').length, 0);
});

test('concurrent cancellation attempts release each reservation only once', async () => {
  const storage = new MemoryStorage();
  const batch = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  const created = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', subtotal: '20', total: '20' },
    [{ productId: 'product-a', quantity: 2, unitPrice: '10', subtotal: '20' }],
    audit('order.created'),
  );
  const base = {
    orderId: created.order.id, actorId: 'patient-a', reasonCode: 'CUSTOMER_REQUEST',
    reason: 'Customer requested cancellation before dispensing.',
  };
  const results = await Promise.allSettled([
    storage.cancelOrderWithAudit({ ...base, idempotencyKey: 'concurrent-key-001' }, audit('order.cancelled')),
    storage.cancelOrderWithAudit({ ...base, idempotencyKey: 'concurrent-key-002' }, audit('order.cancelled')),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((item) => item.id === batch.id)?.quantityReserved, 0);
  assert.equal((await storage.getStockMovements({ batchId: batch.id })).filter((movement) => movement.movementType === 'release').length, 1);
});

test('cancelling a partially dispensed order releases only the unfulfilled reservation balance', async () => {
  const storage = new MemoryStorage();
  const batch = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  const created = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', subtotal: '20', total: '20' },
    [{ productId: 'product-a', quantity: 2, unitPrice: '10', subtotal: '20' }],
    audit('order.created'),
  );
  const [reservation] = await storage.getReservationsByOrder(created.order.id);
  reservation.quantityDispensed = 1;
  reservation.status = 'partially_dispensed';
  const storedBatch = (await storage.getStockBatchesByProduct('product-a')).find((item) => item.id === batch.id)!;
  storedBatch.quantityOnHand = 4;
  storedBatch.quantityReserved = 1;

  const cancelled = await storage.cancelOrderWithAudit({
    orderId: created.order.id, actorId: 'pharmacist-a', reasonCode: 'OPERATIONAL',
    reason: 'Remaining quantity cancelled after partial dispensing.', idempotencyKey: 'partial-cancel-key-001',
  }, audit('order.cancelled'));
  assert.equal(cancelled.order.status, 'partially_cancelled');
  assert.equal(cancelled.releasedReservations[0].quantityReleased, 1);
  assert.equal(storedBatch.quantityOnHand, 4);
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((item) => item.id === batch.id)?.quantityReserved, 0);
  assert.equal((await storage.getReservationsByOrder(created.order.id))[0].quantityDispensed, 1);
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
  await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
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
