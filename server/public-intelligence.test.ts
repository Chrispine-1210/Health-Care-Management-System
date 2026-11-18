import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { correlationId, rateLimit, securityHeaders } from './security';
import { globalErrorHandler } from './errorHandler';

test('public publication boundaries and predictive routes enforce privacy, permissions and branch scope', async (t) => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'public-intelligence-synthetic-test-key-at-least-32';
  process.env.PATIENT_DATA_ENCRYPTION_KEY = 'public-intelligence-synthetic-encryption-at-least-32';
  process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test';
  process.env.INVENTORY_ALERT_EMAIL = '';
  const [{ authService }, { MemoryStorage }, { registerRoutes }, { setStorageForTesting }] = await Promise.all([
    import('./authSystem'), import('./memoryStorage'), import('./routes'), import('./storageManager'),
  ]);
  const storage = new MemoryStorage();
  setStorageForTesting(storage);
  const branchA = await storage.createBranch({ name: 'Synthetic A', address: 'Test address', city: 'Test city', isActive: true, managerId: 'private-manager', licenseNumber: 'internal-license' });
  const branchB = await storage.createBranch({ name: 'Synthetic B', address: 'Test address', city: 'Test city', isActive: true });
  await storage.createBranch({ name: 'Closed', address: 'Test address', city: 'Test city', isActive: false });
  const product = await storage.createProduct({ name: 'Synthetic public item', sku: 'PUBLIC-A', price: '10', prescriptionRequirement: 'required' });
  await storage.createProduct({ name: 'Inactive', sku: 'INACTIVE', price: '10', isActive: false });
  await storage.createProduct({ name: 'Controlled', sku: 'CONTROLLED', price: '10', controlledMedicine: true });
  await storage.createProduct({ name: 'Offline only', sku: 'OFFLINE', price: '10', onlineSaleAllowed: false });
  await storage.createProduct({ name: 'Restricted', sku: 'RESTRICTED', price: '10', prescriptionRequirement: 'restricted_online' });
  for (const [slug, status, publishedAt] of [
    ['published','published',new Date('2020-01-01')], ['draft','draft',null],
    ['future','published',new Date('2099-01-01')], ['undated','published',null],
  ] as const) await storage.createContentItem({ title: slug, slug, status, publishedAt, content: `Synthetic ${slug}`, authorId: 'private-author' });
  await storage.createStockBatch({ productId: product.id, branchId: branchA.id, batchNumber: 'A', quantityOnHand: 20, expiryDate: new Date('2030-01-01'), costPrice: '5' });
  await storage.createStockBatch({ productId: product.id, branchId: branchB.id, batchNumber: 'B', quantityOnHand: 50, expiryDate: new Date('2030-01-01'), costPrice: '5' });
  const makeActor = async (role: string, branchId?: string) => {
    const email = `${role}-${branchId ?? 'global'}@example.test`;
    await authService.register(email, 'Synthetic-only-password-42!', role, 'Test', 'Actor');
    const result = await authService.login(email, 'Synthetic-only-password-42!');
    assert.ok(result);
    await storage.upsertUser({ id: result.user.id, email, role, branchId });
    return result.tokens.accessToken;
  };
  const patient = await makeActor('patient');
  const pharmacist = await makeActor('pharmacist', branchA.id);
  const unassigned = await makeActor('pharmacist');
  const admin = await makeActor('system_administrator');
  const branchAdmin = await makeActor('branch_administrator',branchA.id);
  const app = express();
  app.use(securityHeaders, correlationId, express.json({ limit: '8kb' }));
  const server = await registerRoutes(app);
  app.get('/api/synthetic-failure', (_req, _res, next) => next(new Error('private-patient-and-password-payload')));
  app.use(globalErrorHandler);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    setStorageForTesting(null);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const request = (path: string, token?: string, init: RequestInit = {}) => fetch(`http://127.0.0.1:${address.port}${path}`, {
    ...init, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...init.headers },
  });

  await t.test('public catalogue excludes inactive, controlled and online-restricted items', async () => {
    const response = await request('/api/public/catalogue');
    const items = await response.json() as any[];
    assert.equal(response.status, 200);
    assert.equal(items.length, 1);
    assert.equal(items[0].prescriptionRequired, true);
    assert.equal('sku' in items[0], false);
    assert.equal('storageConditions' in items[0], false);
  });
  await t.test('public branches expose customer contact fields without internal identifiers', async () => {
    for (const path of ['/api/public/branches', '/api/branches']) {
      const items = await (await request(path)).json() as any[];
      assert.equal(items.length,2);
      assert.equal('managerId' in items[0], false);
      assert.equal('licenseNumber' in items[0], false);
    }
  });
  await t.test('draft, future and undated articles cannot be retrieved through public filters or slugs', async () => {
    const items = await (await request('/api/content?status=draft')).json() as any[];
    assert.deepEqual(items.map((i) => i.slug), ['published']);
    assert.equal('authorId' in items[0],false);
    for (const slug of ['draft','future','undated']) assert.equal((await request(`/api/content/${slug}`)).status,404);
    assert.equal((await request('/api/admin/content')).status,401);
    assert.equal((await request('/api/admin/content',patient)).status,403);
    assert.equal((await (await request('/api/admin/content',admin)).json() as any[]).length,4);
  });
  await t.test('article publishing dates the record and archiving removes public access', async () => {
    const created = await request('/api/admin/content',admin,{method:'POST',body:JSON.stringify({title:'Synthetic update',slug:'synthetic-update',content:'Synthetic plain text',status:'published'})});
    assert.equal(created.status,201);
    const article = await created.json() as any;
    assert.ok(article.publishedAt);
    assert.equal((await request('/api/content/synthetic-update')).status,200);
    assert.equal((await request(`/api/admin/content/${article.id}`,admin,{method:'PATCH',body:JSON.stringify({status:'archived'})})).status,200);
    assert.equal((await request('/api/content/synthetic-update')).status,404);
  });
  await t.test('forecasting requires inventory permission and denies cross-branch and unassigned actors', async () => {
    const query = `/api/inventory/forecast?productId=${product.id}&branchId=${branchA.id}`;
    assert.equal((await request(query)).status,401);
    assert.equal((await request(query,patient)).status,403);
    assert.equal((await request(query,unassigned)).status,403);
    assert.equal((await request(query.replace(branchA.id,branchB.id),pharmacist)).status,403);
    const response = await request(query,pharmacist);
    assert.equal(response.status,200);
    const data = await response.json() as any;
    assert.equal(data.status,'insufficient_evidence');
    assert.equal(data.forecast,null);
    assert.equal(data.series.availableStock,20);
    assert.equal(data.automationAllowed,false);
    const batches = await (await request('/api/admin/inventory',pharmacist)).json() as any[];
    assert.ok(batches.every((b) => b.branchId === branchA.id));
    const branchStats = await (await request('/api/admin/stats',branchAdmin)).json() as any;
    assert.equal(branchStats.scope,'assigned_branch');
    assert.equal(branchStats.totalCustomers,null);
    assert.equal(branchStats.totalRevenue,null);
  });
  await t.test('scenario output is labeled and rejects non-aggregate data and invalid input', async () => {
    const body = { dailyCounts: Array(28).fill(4), availableStock:20, leadTimeDays:7 };
    const send = (value: unknown, token = pharmacist) => request('/api/inventory/forecast-scenario',token,{ method:'POST',body:JSON.stringify(value) });
    assert.equal((await send(body,patient)).status,403);
    const data = await (await send(body)).json() as any;
    assert.equal(data.source,'user_supplied_scenario');
    assert.equal(data.verifiedBusinessEvidence,false);
    assert.equal(data.forecast.automationAllowed,false);
    assert.equal((await send({ ...body, patientName:'Synthetic patient' })).status,400);
    assert.equal((await send({ ...body, dailyCounts:[] })).status,400);
    assert.equal((await send({ ...body, leadTimeDays:0 })).status,400);
    assert.equal((await send({ ...body, availableStock:-1 })).status,400);
  });
  await t.test('branch scans include expiry gaps and already expired stock without leaking another branch', async () => {
    await storage.createStockBatch({ productId:product.id, branchId:branchA.id, batchNumber:'EXPIRES-20', quantityOnHand:2, expiryDate:new Date(Date.now()+20*86400000), costPrice:'5' });
    await storage.createStockBatch({ productId:product.id, branchId:branchA.id, batchNumber:'EXPIRED', quantityOnHand:3, expiryDate:new Date(Date.now()-86400000), costPrice:'5' });
    const response = await request('/api/inventory/scan',pharmacist,{method:'POST',body:'{}'});
    assert.equal(response.status,200);
    const alerts = (await response.json() as any).data.alerts as any[];
    assert.ok(alerts.every((a) => a.branchId === branchA.id));
    assert.ok(alerts.some((a) => a.type === 'expiry' && a.message.includes('EXPIRES-20')));
    assert.ok(alerts.some((a) => a.type === 'expiry' && a.message.includes('is expired') && a.severity === 'critical'));
  });
  await t.test('reliability information is restricted and unhandled errors redact payloads', async () => {
    assert.equal((await request('/api/engineering/reliability',patient)).status,403);
    const snapshot = await (await request('/api/engineering/reliability',admin)).json() as any;
    assert.equal(snapshot.scope,'current_process_only');
    assert.equal(snapshot.assessment,'insufficient_evidence');
    const response = await request('/api/synthetic-failure');
    assert.equal(response.status,500);
    assert.ok(!(await response.text()).includes('private-patient'));
    const malformed = await request('/api/inventory/forecast-scenario',pharmacist,{ method:'POST',body:'{' });
    assert.equal(malformed.status,400);
    assert.equal((await malformed.json() as any).error.code,'INVALID_REQUEST');
  });
});

test('rate-limit budgets are independent, path changes cannot reset them and denial includes retry guidance', async (t) => {
  const app = express();
  app.use(rateLimit(60_000,5));
  app.use('/auth',rateLimit(60_000,2));
  app.get('/auth/:name',(_req,res) => res.json({ok:true}));
  const server = app.listen(0,'127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening',resolve));
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const fetchAttempt = (path: string) => fetch(`http://127.0.0.1:${address.port}${path}`);
  assert.equal((await fetchAttempt('/auth/one')).status,200);
  assert.equal((await fetchAttempt('/auth/two')).status,200);
  const limited = await fetchAttempt('/auth/three');
  assert.equal(limited.status,429);
  assert.equal(limited.headers.get('ratelimit-remaining'),'0');
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
});
