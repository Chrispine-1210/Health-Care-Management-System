import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { securityHeaders } from './security';

test('API responses prohibit browser and CDN caching for success, denial and failure', async (t) => {
  const app = express();
  app.use(securityHeaders);
  app.get('/api/records/:status', (req, res) => res.status(Number(req.params.status)).json({ synthetic: true }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  for (const status of [200, 401, 500]) {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/records/${status}`);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
    assert.equal(response.headers.get('cdn-cache-control'), 'no-store');
    assert.equal(response.headers.get('vercel-cdn-cache-control'), 'no-store');
    assert.ok(response.headers.get('vary')?.includes('Authorization'));
    await response.text();
  }
});
