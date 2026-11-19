import assert from 'node:assert/strict';
import test from 'node:test';
import { logger, redactLogValue } from './logger';

test('structured logs redact credentials, tokens, clinical data, payment secrets, and database URLs', () => {
  const redacted = redactLogValue({
    authorization: 'Bearer secret-token',
    cookie: 'session=secret',
    password: 'password',
    medicalInformation: 'diagnosis',
    cardNumber: '4111111111111111',
    nested: { databaseUrl: 'postgresql://user:password@db/prod', safe: 'visible' },
  }) as Record<string, any>;
  assert.equal(redacted.authorization, '[REDACTED]');
  assert.equal(redacted.cookie, '[REDACTED]');
  assert.equal(redacted.nested.databaseUrl, '[REDACTED]');
  assert.equal(redacted.nested.safe, 'visible');

  logger.info('redaction-test', { refreshToken: 'secret', safe: 'visible' });
  const entry = logger.getLogs(undefined, 1)[0];
  assert.equal(entry.context?.refreshToken, '[REDACTED]');
  assert.equal(entry.context?.safe, 'visible');
});
