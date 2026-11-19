import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

const workerCode = transformSync(readFileSync(new URL('../client/src/service-worker.ts', import.meta.url), 'utf8'), { loader: 'ts' }).code;

function workerHarness(offline = false) {
  const listeners = new Map<string, (event: any) => void>();
  const calls: Array<{ request: Request; options?: RequestInit }> = [];
  const deleted: string[] = [];
  const cached: string[] = [];
  let cacheReads = 0;
  vm.runInNewContext(workerCode, {
    URL, Response,
    location: { origin: 'https://pharmacy.test' },
    addEventListener: (name: string, callback: (event: any) => void) => listeners.set(name, callback),
    clients: { claim: async () => undefined },
    caches: {
      keys: async () => ['thandizo-v1', 'thandizo-v2', 'thandizo-v3', 'unrelated-cache'],
      delete: async (key: string) => { deleted.push(key); },
      match: async () => { cacheReads++; return new Response('previous patient data'); },
      open: async () => ({ put: async (request: Request) => { cached.push(request.url); } }),
    },
    fetch: async (request: Request, options?: RequestInit) => {
      calls.push({ request, options });
      if (offline) throw new Error('offline');
      return new Response('{"synthetic":true}', { headers: { 'content-type': 'application/json' } });
    },
  });
  const fetchRequest = (path: string, authenticated = false) => {
    let response: Promise<Response> | undefined;
    const request = new Request(`https://pharmacy.test${path}`, { headers: authenticated ? { Authorization: 'Bearer synthetic-token' } : {} });
    listeners.get('fetch')!({ request, respondWith: (value: Promise<Response>) => { response = value; } });
    return response;
  };
  return { listeners, calls, deleted, cached, fetchRequest, cacheReads: () => cacheReads };
}

test('service worker never caches API or authenticated responses', async () => {
  const worker = workerHarness();
  for (const [path, authenticated] of [['/api/prescriptions', false], ['/api', false], ['/private-document', true]] as const) {
    assert.equal((await worker.fetchRequest(path, authenticated))?.status, 200);
  }
  assert.equal(worker.calls.length, 3);
  assert.ok(worker.calls.every((call) => call.options?.cache === 'no-store'));
  assert.equal(worker.cacheReads(), 0);
  assert.deepEqual(worker.cached, []);
});

test('offline API requests cannot replay the previous patient response', async () => {
  const worker = workerHarness(true);
  await assert.rejects(worker.fetchRequest('/api/orders')!, /offline/);
  assert.equal(worker.cacheReads(), 0);
  assert.deepEqual(worker.cached, []);
});

test('worker activation purges legacy caches containing API responses', async () => {
  const worker = workerHarness();
  let activation: Promise<unknown> | undefined;
  worker.listeners.get('activate')!({ waitUntil: (value: Promise<unknown>) => { activation = value; } });
  await activation;
  assert.deepEqual(worker.deleted, ['thandizo-v1', 'thandizo-v2']);
});
