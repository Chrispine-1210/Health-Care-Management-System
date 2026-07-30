import assert from 'node:assert/strict';
import test from 'node:test';
import type { InsertAuditLog } from '@shared/schema';
import { MemoryStorage } from './memoryStorage';

class FailingAuditStorage extends MemoryStorage {
  override async createAuditLog(_log: InsertAuditLog): Promise<never> {
    throw new Error('deliberate audit failure');
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
    storage.reviewPrescriptionWithAudit(prescription.id, { status: 'approved', reviewedBy: 'pharmacist-a' }, audit('prescription.review')),
    /deliberate audit failure/,
  );
  const unchanged = await storage.getPrescription(prescription.id);
  assert.equal(unchanged?.status, 'pending');
  assert.equal(unchanged?.reviewedBy, undefined);
});

test('successful transactional mutations append audit entries', async () => {
  const storage = new MemoryStorage();
  await storage.upsertUser({ id: 'user-a', role: 'patient' });
  const prescription = await storage.createPrescription({ patientId: 'patient-a', status: 'pending' });
  await storage.assignUserRoleWithAudit('user-a', 'receptionist', 'branch-a', audit('user.role.change'));
  await storage.reviewPrescriptionWithAudit(prescription.id, { status: 'approved' }, audit('prescription.review'));
  const logs = await storage.getAuditLogs();
  assert.deepEqual(logs.map((entry) => entry.action).sort(), ['prescription.review', 'user.role.change']);
});
