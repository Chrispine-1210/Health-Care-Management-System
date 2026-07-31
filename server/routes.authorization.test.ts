import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';

test('registered routes enforce authentication, permissions, ownership, and non-disclosure', async (t) => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'route-authorization-test-secret-at-least-32-characters';
  process.env.PATIENT_DATA_ENCRYPTION_KEY = 'route-test-encryption-key-at-least-32-characters';
  process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test';
  const [{ authService }, { MemoryStorage }, { registerRoutes }, { setStorageForTesting }] = await Promise.all([
    import('./authSystem'),
    import('./memoryStorage'),
    import('./routes'),
    import('./storageManager'),
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

  await storage.upsertUser({ id: patientA.userId, email: 'patient-a@example.test', role: 'patient', firstName: 'Patient', lastName: 'A' });
  await storage.upsertUser({ id: patientB.userId, email: 'patient-b@example.test', role: 'patient', firstName: 'Patient', lastName: 'B' });
  await storage.upsertUser({ id: branchAdministrator.userId, email: 'branch-admin@example.test', role: 'branch_administrator', branchId: 'branch-a' });
  const orderA = await storage.createOrder({
    customerId: patientA.userId,
    branchId: 'branch-a',
    subtotal: '10.00',
    total: '10.00',
    status: 'pending',
    paymentStatus: 'pending',
  });
  const orderB = await storage.createOrder({ customerId: patientB.userId, branchId: 'branch-b', subtotal: '10.00', total: '10.00' });

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

  const forbiddenPermission = await request('/api/admin/audit-logs', patientA.token);
  assert.equal(forbiddenPermission.status, 403);
  assert.equal((await forbiddenPermission.json() as { message: string }).message, 'Forbidden');

  await storage.updateUser(patientB.userId, { accountStatus: 'disabled' });
  const disabledUser = await request('/api/orders', patientB.token);
  assert.equal(disabledUser.status, 401);
  assert.equal((await disabledUser.json() as { message: string }).message, 'Invalid or expired token');

  server.closeIdleConnections();
});
