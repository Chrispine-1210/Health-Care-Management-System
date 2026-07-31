import assert from 'node:assert/strict';
import test from 'node:test';
import { MalawiPaymentGateway } from './payment-gateway';

test('payment transactions are bound to their originating order', async () => {
  const gateway = new MalawiPaymentGateway('', 'sandbox');
  const result = await gateway.processPayment({ orderId: 'order-a', amount: 100, phoneNumber: '0999123456', method: 'tnm_mpamba' });
  assert.equal(result.success, true);
  assert.ok(result.transactionId);
  assert.equal(gateway.getTransactionOrderId(result.transactionId), 'order-a');
  assert.equal(gateway.getTransactionOrderId('unknown'), undefined);
});

test('production payment gateway fails closed until a real provider is implemented', async () => {
  const gateway = new MalawiPaymentGateway('configured-key', 'production');
  const result = await gateway.processPayment({ orderId: 'order-a', amount: 100, phoneNumber: '0999123456', method: 'card' });
  assert.deepEqual(result, { success: false, message: 'Payment provider integration unavailable', status: 'failed' });
});
