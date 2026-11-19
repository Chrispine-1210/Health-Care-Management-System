import assert from 'node:assert/strict';
import test from 'node:test';

test('production email requires SMTP configuration and provider acceptance', async () => {
  const previous = { ...process.env };
  try {
    process.env.NODE_ENV = 'production';
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_USER = 'synthetic';
    process.env.SMTP_PASSWORD = 'synthetic';
    process.env.SMTP_FROM = 'sender@example.test';
    const { EmailService } = await import('./emailService');
    const payload = { to: 'recipient@example.test', subject: 'Synthetic', html: '<p>Synthetic</p>' };
    const sent: unknown[] = [];
    const service = new EmailService(() => ({ sendMail: async (message) => {
      sent.push(message);
      return { accepted: [payload.to], rejected: [] };
    } }));
    assert.equal(await service.send(payload), true);
    assert.deepEqual(sent, [{ ...payload, from: 'sender@example.test' }]);
    const rejected = new EmailService(() => ({ sendMail: async () => ({ accepted: [], rejected: [payload.to] }) }));
    assert.equal(await rejected.send(payload), false);
    const partial = new EmailService(() => ({ sendMail: async () => ({ accepted: [payload.to], rejected: ['cc@example.test'] }) }));
    assert.equal(await partial.send({ ...payload, cc: ['cc@example.test'] }), false);
    const failed = new EmailService(() => ({ sendMail: async () => { throw new Error('Synthetic SMTP failure'); } }));
    assert.equal(await failed.send(payload), false);
    delete process.env.SMTP_FROM;
    assert.equal(await new EmailService(() => ({ sendMail: async () => { throw new Error('must not send'); } })).send(payload), false);
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    assert.equal(await new EmailService().send(payload), false);
  } finally {
    process.env = previous;
  }
});
