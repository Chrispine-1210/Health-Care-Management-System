import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';

test('registered routes enforce authentication, permissions, ownership, and non-disclosure', async (t) => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'route-authorization-test-secret-at-least-32-characters';
  process.env.PATIENT_DATA_ENCRYPTION_KEY = 'route-test-encryption-key-at-least-32-characters';
  process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test';
  const [{ authService }, { MemoryStorage }, { registerRoutes }, { setStorageForTesting }, { notificationService }] = await Promise.all([
    import('./authSystem'),
    import('./memoryStorage'),
    import('./routes'),
    import('./storageManager'),
    import('./notificationService'),
  ]);
  const tokenFor = async (role: string, suffix: string) => {
    const email = `${role}-${suffix}@example.test`;
    const password = 'Correct-Horse-42!';
    await authService.register(email, password, role, role, suffix);
    const login = await authService.login(email, password);
    assert.ok(login);
    return { token: login.tokens.accessToken, userId: login.user.id };
  };
  const storage = new MemoryStorage();
  setStorageForTesting(storage);

  const patientA = await tokenFor('patient', 'route-a');
  const patientB = await tokenFor('patient', 'route-b');
  const administrator = await tokenFor('system_administrator', 'route-admin');
  const branchAdministrator = await tokenFor('branch_administrator', 'route-branch-admin');
  const pharmacist = await tokenFor('pharmacist', 'route-pharmacist');

  await storage.upsertUser({ id: patientA.userId, email: 'patient-a@example.test', role: 'patient', firstName: 'Patient', lastName: 'A' });
  await storage.upsertUser({ id: patientB.userId, email: 'patient-b@example.test', role: 'patient', firstName: 'Patient', lastName: 'B' });
  await storage.upsertUser({ id: branchAdministrator.userId, email: 'branch-admin@example.test', role: 'branch_administrator', branchId: 'branch-a' });
  await storage.upsertUser({ id: pharmacist.userId, email: 'pharmacist@example.test', role: 'pharmacist', branchId: 'branch-a' });
  const orderA = await storage.createOrder({
    customerId: patientA.userId,
    branchId: 'branch-a',
    subtotal: '10.00',
    total: '10.00',
    status: 'pending',
    paymentStatus: 'pending',
  });
  const orderB = await storage.createOrder({ customerId: patientB.userId, branchId: 'branch-b', subtotal: '10.00', total: '10.00' });
  const appointmentA = await storage.createAppointment({
    patientId: patientA.userId,
    scheduledAt: new Date('2026-08-03T09:00:00.000Z'),
    type: 'in-person',
    status: 'scheduled',
  });
  const pendingPrescription = await storage.createPrescription({ patientId: patientA.userId, status: 'pending' });
  const branchBatch = await storage.createStockBatch({ productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5, expiryDate: new Date('2030-01-01'), costPrice: '5' });
  await storage.createStockBatch({ productId: 'product-b', branchId: 'branch-b', batchNumber: 'B-1', quantityOnHand: 5, expiryDate: new Date('2030-01-01'), costPrice: '5' });
  const cancellableOrder = await storage.createOrderWithItemsAndAudit(
    { customerId: patientA.userId, branchId: 'branch-a', subtotal: '10', total: '10' },
    [{ productId: 'product-a', quantity: 1, unitPrice: '10', subtotal: '10' }],
    { userId: patientA.userId, action: 'order.created', entityType: 'order' },
  );
  await storage.createOrderWithItemsAndAudit(
    { customerId: patientB.userId, branchId: 'branch-b', subtotal: '10', total: '10' },
    [{ productId: 'product-b', quantity: 1, unitPrice: '10', subtotal: '10' }],
    { userId: patientB.userId, action: 'order.created', entityType: 'order' },
  );

  const app = express();
  app.use(express.json());
  const server = await registerRoutes(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    setStorageForTesting(null);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const request = (path: string, token?: string, init: RequestInit = {}) => fetch(`${baseUrl}${path}`, {
    ...init,
    signal: AbortSignal.timeout(3000),
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...init.headers },
  });

  const anonymous = await request(`/api/orders/${orderA.id}`);
  assert.equal(anonymous.status, 401);
  assert.equal((await anonymous.json() as { message: string }).message, 'No authentication token provided');

  const owner = await request(`/api/orders/${orderA.id}`, patientA.token);
  assert.equal(owner.status, 200);

  const otherPatient = await request(`/api/orders/${orderA.id}`, patientB.token);
  assert.equal(otherPatient.status, 404);
  assert.equal((await otherPatient.json() as { message: string }).message, 'Order not found');

  const sameBranchOrder = await request(`/api/orders/${orderA.id}`, branchAdministrator.token);
  assert.equal(sameBranchOrder.status, 200);
  const wrongBranchOrder = await request(`/api/orders/${orderB.id}`, branchAdministrator.token);
  assert.equal(wrongBranchOrder.status, 404);

  const patientStockLedger = await request('/api/inventory/movements', patientA.token);
  assert.equal(patientStockLedger.status, 403);
  const branchStockLedger = await request('/api/inventory/movements', branchAdministrator.token);
  assert.equal(branchStockLedger.status, 200);
  const branchMovements = await branchStockLedger.json() as Array<{ branchId: string }>;
  assert.equal(branchMovements.length, 1);
  assert.equal(branchMovements[0].branchId, 'branch-a');

  const crossBranchReceipt = await request('/api/admin/inventory/batch', pharmacist.token, {
    method: 'POST',
    body: JSON.stringify({ productId: 'product-a', branchId: 'branch-b', batchNumber: 'CROSS', quantityOnHand: 5, expiryDate: '2030-01-01T00:00:00.000Z', costPrice: '5' }),
  });
  assert.equal(crossBranchReceipt.status, 403);
  const reservedQuantityInjection = await request('/api/admin/inventory/batch', pharmacist.token, {
    method: 'POST',
    body: JSON.stringify({ productId: 'product-a', branchId: 'branch-a', batchNumber: 'INJECT', quantityOnHand: 5, quantityReserved: 5, expiryDate: '2030-01-01T00:00:00.000Z', costPrice: '5' }),
  });
  assert.equal(reservedQuantityInjection.status, 400);

  const quantityInjection = await request(`/api/admin/inventory/batch/${branchBatch.id}`, pharmacist.token, {
    method: 'PATCH', body: JSON.stringify({ quantityOnHand: 500 }),
  });
  assert.equal(quantityInjection.status, 400);

  const adjustment = await request(`/api/admin/inventory/batch/${branchBatch.id}/adjust`, pharmacist.token, {
    method: 'POST', body: JSON.stringify({ quantityDelta: -1, reason: 'Damaged unit found during physical count' }),
  });
  assert.equal(adjustment.status, 200);
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((batch) => batch.id === branchBatch.id)?.quantityOnHand, 4);

  const notificationCountBeforeCancellation = notificationService.getQueueStatus().length;
  const cancellationWithoutKey = await request(`/api/orders/${cancellableOrder.order.id}/cancel`, patientA.token, {
    method: 'POST', body: JSON.stringify({ reasonCode: 'CUSTOMER_REQUEST', reason: 'Customer requested cancellation before dispensing.' }),
  });
  assert.equal(cancellationWithoutKey.status, 400);
  const otherPatientCancellation = await request(`/api/orders/${cancellableOrder.order.id}/cancel`, patientB.token, {
    method: 'POST', headers: { 'idempotency-key': 'cancel-handler-001' },
    body: JSON.stringify({ reasonCode: 'CUSTOMER_REQUEST', reason: 'Customer requested cancellation before dispensing.' }),
  });
  assert.equal(otherPatientCancellation.status, 404);
  const unauthorisedBatchSubstitution = await request(`/api/orders/${cancellableOrder.order.id}/items/unknown-item/substitute-batch`, patientA.token, {
    method: 'POST',
    body: JSON.stringify({ reservationId: 'unknown-reservation', substituteBatchId: 'unknown-batch', idempotencyKey: 'substitute-auth-check', reason: 'Patient must not be able to alter pharmacy stock reservations.' }),
  });
  assert.equal(unauthorisedBatchSubstitution.status, 403);
  const cancellation = await request(`/api/orders/${cancellableOrder.order.id}/cancel`, patientA.token, {
    method: 'POST', headers: { 'idempotency-key': 'cancel-handler-001' },
    body: JSON.stringify({ reasonCode: 'CUSTOMER_REQUEST', reason: 'Customer requested cancellation before dispensing.' }),
  });
  assert.equal(cancellation.status, 200);
  const cancellationBody = await cancellation.json() as { status: string; releasedReservations: Array<{ quantityReleased: number }>; idempotentReplay: boolean };
  assert.equal(cancellationBody.status, 'cancelled');
  assert.equal(cancellationBody.releasedReservations[0].quantityReleased, 1);
  assert.equal(cancellationBody.idempotentReplay, false);
  const cancellationReplay = await request(`/api/orders/${cancellableOrder.order.id}/cancel`, patientA.token, {
    method: 'POST', headers: { 'idempotency-key': 'cancel-handler-001' },
    body: JSON.stringify({ reasonCode: 'CUSTOMER_REQUEST', reason: 'Customer requested cancellation before dispensing.' }),
  });
  assert.equal(cancellationReplay.status, 200);
  assert.equal((await cancellationReplay.json() as { idempotentReplay: boolean }).idempotentReplay, true);
  assert.equal(notificationService.getQueueStatus().length, notificationCountBeforeCancellation + 1);

  const wrongOwnerPayment = await request('/api/payments/process', patientB.token, {
    method: 'POST',
    body: JSON.stringify({ orderId: orderA.id, method: 'tnm_mpamba', phoneNumber: '0999123456' }),
  });
  assert.equal(wrongOwnerPayment.status, 404);

  const paymentFieldInjection = await request('/api/payments/process', patientA.token, {
    method: 'POST',
    body: JSON.stringify({ orderId: orderA.id, method: 'tnm_mpamba', phoneNumber: '0999123456', paymentStatus: 'completed' }),
  });
  assert.equal(paymentFieldInjection.status, 400);
  assert.equal((await storage.getOrder(orderA.id))?.paymentStatus, 'pending');

  const payment = await request('/api/payments/process', patientA.token, {
    method: 'POST',
    body: JSON.stringify({ orderId: orderA.id, method: 'tnm_mpamba', phoneNumber: '0999123456' }),
  });
  assert.equal(payment.status, 200);
  const paymentBody = await payment.json() as { transactionId: string };
  assert.ok(paymentBody.transactionId);
  assert.equal((await storage.getOrder(orderA.id))?.paymentStatus, 'processing');

  const repeatedPayment = await request('/api/payments/process', patientA.token, {
    method: 'POST',
    body: JSON.stringify({ orderId: orderA.id, method: 'tnm_mpamba', phoneNumber: '0999123456' }),
  });
  assert.equal(repeatedPayment.status, 409);

  const otherPaymentStatus = await request(`/api/payments/check/${paymentBody.transactionId}`, patientB.token, { method: 'POST' });
  assert.equal(otherPaymentStatus.status, 404);
  const ownerPaymentStatus = await request(`/api/payments/check/${paymentBody.transactionId}`, patientA.token, { method: 'POST' });
  assert.equal(ownerPaymentStatus.status, 200);

  const adminClinicalRead = await request('/api/prescriptions/patient/unknown-patient', administrator.token);
  assert.equal(adminClinicalRead.status, 403);

  const crossUserUpdate = await request(`/api/users/${patientA.userId}`, patientB.token, {
    method: 'PATCH',
    body: JSON.stringify({ firstName: 'Tampered' }),
  });
  assert.equal(crossUserUpdate.status, 404);
  assert.equal((await storage.getUser(patientA.userId))?.firstName, 'Patient');

  const privilegeInjection = await request(`/api/users/${patientA.userId}`, patientA.token, {
    method: 'PATCH',
    body: JSON.stringify({ role: 'super_administrator', branchId: 'branch-b' }),
  });
  assert.notEqual(privilegeInjection.status, 200);
  assert.equal((await storage.getUser(patientA.userId))?.role, 'patient');
  assert.equal((await storage.getUser(patientA.userId))?.branchId, null);

  const clinicalFieldInjection = await request(`/api/appointments/${appointmentA.id}`, patientA.token, {
    method: 'PATCH',
    body: JSON.stringify({ consultationNotes: 'Client-controlled clinical note', status: 'completed' }),
  });
  assert.equal(clinicalFieldInjection.status, 400);
  assert.equal((await storage.getAppointment(appointmentA.id))?.consultationNotes, undefined);
  assert.equal((await storage.getAppointment(appointmentA.id))?.status, 'scheduled');

  const appointmentCancellation = await request(`/api/appointments/${appointmentA.id}`, patientA.token, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled' }),
  });
  assert.equal(appointmentCancellation.status, 200);
  assert.equal((await storage.getAppointment(appointmentA.id))?.status, 'cancelled');
  assert.ok((await storage.getAuditLogs()).some((entry) => entry.action === 'appointment.cancelled' && entry.entityId === appointmentA.id));

  const prematureDispensing = await request(`/api/prescriptions/${pendingPrescription.id}/review`, pharmacist.token, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'dispensed' }),
  });
  assert.equal(prematureDispensing.status, 409);
  assert.equal((await storage.getPrescription(pendingPrescription.id))?.status, 'pending');

  const approval = await request(`/api/prescriptions/${pendingPrescription.id}/review`, pharmacist.token, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'approved' }),
  });
  assert.equal(approval.status, 200);

  const repeatedApproval = await request(`/api/prescriptions/${pendingPrescription.id}/review`, pharmacist.token, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'approved' }),
  });
  assert.equal(repeatedApproval.status, 409);

  const dispensing = await request(`/api/prescriptions/${pendingPrescription.id}/review`, pharmacist.token, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'dispensed' }),
  });
  assert.equal(dispensing.status, 409);
  assert.equal((await storage.getPrescription(pendingPrescription.id))?.status, 'approved');

  const patientRevocation = await request(`/api/prescriptions/${pendingPrescription.id}/revoke`, patientA.token, {
    method: 'POST', body: JSON.stringify({ reason: 'Patient attempted an unauthorised clinical revocation.' }),
  });
  assert.equal(patientRevocation.status, 403);
  const pharmacistRevocation = await request(`/api/prescriptions/${pendingPrescription.id}/revoke`, pharmacist.token, {
    method: 'POST', body: JSON.stringify({ reason: 'Pharmacist revoked approval after a clinical reassessment.' }),
  });
  assert.equal(pharmacistRevocation.status, 200);
  assert.equal((await storage.getPrescription(pendingPrescription.id))?.status, 'revoked');

  const forbiddenPermission = await request('/api/admin/audit-logs', patientA.token);
  assert.equal(forbiddenPermission.status, 403);
  assert.equal((await forbiddenPermission.json() as { message: string }).message, 'Forbidden');

  await storage.updateUser(patientB.userId, { accountStatus: 'disabled' });
  const disabledUser = await request('/api/orders', patientB.token);
  assert.equal(disabledUser.status, 401);
  assert.equal((await disabledUser.json() as { message: string }).message, 'Invalid or expired token');

  const unauthenticatedLogout = await request('/api/logout', undefined, { method: 'POST' });
  assert.equal(unauthenticatedLogout.status, 401);
  const logout = await request('/api/logout', patientA.token, { method: 'POST' });
  assert.equal(logout.status, 200);
  const revokedSession = await request('/api/orders', patientA.token);
  assert.equal(revokedSession.status, 401);

  server.closeIdleConnections();
});
