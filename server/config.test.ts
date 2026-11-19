import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDatabaseUrl } from './database-config.mjs';
import { productionConfigurationIssues } from './config';

function productionEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://synthetic:synthetic@localhost/thandizo_preview',
    JWT_SECRET: 'a'.repeat(64),
    PATIENT_DATA_ENCRYPTION_KEY: 'b'.repeat(64),
    ALLOWED_ORIGINS: 'https://pharmacy.example.test',
    USE_DATABASE_STORAGE: 'true',
  };
}

test('branch database selection overrides project integration defaults in API and migrations', () => {
  const env = { ...productionEnv(), VERCEL: '1', POSTGRES_URL: 'postgresql://project-default' };
  assert.equal(resolveDatabaseUrl(env), env.DATABASE_URL);
  assert.equal(resolveDatabaseUrl({ ...env, THANDIZO_DATABASE_URL: ' explicit-rotated-value ' }), 'explicit-rotated-value');
  assert.equal(resolveDatabaseUrl({ ...env, THANDIZO_DATABASE_URL: ' ' }), env.DATABASE_URL);
  assert.equal(resolveDatabaseUrl({ POSTGRES_URL: env.POSTGRES_URL }), env.POSTGRES_URL);
  assert.equal(resolveDatabaseUrl({ DATABASE_URL: ' ', POSTGRES_URL: ' fallback ' }), 'fallback');
  assert.equal(resolveDatabaseUrl({}), undefined);
});

test('production configuration requires persistent storage and independent non-placeholder secrets', () => {
  assert.deepEqual(productionConfigurationIssues(productionEnv()), []);
  for (const invalid of [
    { JWT_SECRET: '' },
    { PATIENT_DATA_ENCRYPTION_KEY: '' },
    { JWT_SECRET: 'short' },
    { JWT_SECRET: 'change-this-to-a-long-random-production-secret' },
    { PATIENT_DATA_ENCRYPTION_KEY: 'a'.repeat(64) },
    { USE_DATABASE_STORAGE: 'false' },
    { DATABASE_URL: '' },
  ]) assert.ok(productionConfigurationIssues({ ...productionEnv(), ...invalid }).length, JSON.stringify(Object.keys(invalid)));
});

test('production CORS accepts only explicit HTTPS origins', () => {
  for (const origin of ['', '*', 'https://ok.example,*', 'http://pharmacy.test', 'https://pharmacy.test/path', 'https://user:pass@pharmacy.test']) {
    assert.ok(productionConfigurationIssues({ ...productionEnv(), ALLOWED_ORIGINS: origin }).length, origin);
  }
  assert.deepEqual(productionConfigurationIssues({ ...productionEnv(), ALLOWED_ORIGINS: 'https://one.example,https://two.example:8443' }), []);
});
