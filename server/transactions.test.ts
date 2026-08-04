import assert from 'node:assert/strict';
import test from 'node:test';
import type { EmergencyAccessGrant, InsertAuditLog, InsertEmergencyAccessGrant } from '@shared/schema';
import { MemoryStorage } from './memoryStorage';

class FailingAuditStorage extends MemoryStorage {
  lastCreatedGrantId?: string;
  failAudit = true;

  override async createAuditLog(log: InsertAuditLog) {
    if (this.failAudit) throw new Error('deliberate audit failure');
    return super.createAuditLog(log);
  }

  override async createEmergencyAccessGrant(grant: InsertEmergencyAccessGrant): Promise<EmergencyAccessGrant> {
    const created = await super.createEmergencyAccessGrant(grant);
    this.lastCreatedGrantId = created.id;
    return created;
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
    storage.reviewPrescriptionWithAudit(prescription.id, 'pending', { status: 'approved', reviewedBy: 'pharmacist-a' }, audit('prescription.review')),
    /deliberate audit failure/,
  );
  const unchanged = await storage.getPrescription(prescription.id);
  assert.equal(unchanged?.status, 'pending');
  assert.equal(unchanged?.reviewedBy, undefined);
});

test('payment-state update rolls back when its audit insert fails', async () => {
  const storage = new FailingAuditStorage();
  const order = await storage.createOrder({ customerId: 'patient-a', branchId: 'branch-a', subtotal: '10', total: '10', paymentStatus: 'pending' });
  await assert.rejects(
    storage.updateOrderWithAudit(order.id, { paymentStatus: 'completed' }, audit('payment.confirmed')),
    /deliberate audit failure/,
  );
  assert.equal((await storage.getOrder(order.id))?.paymentStatus, 'pending');
});

test('order creation rolls back order and items when its audit insert fails', async () => {
  const storage = new FailingAuditStorage();
  const batch = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  await assert.rejects(
    storage.createOrderWithItemsAndAudit(
      { customerId: 'patient-a', branchId: 'branch-a', subtotal: '10', total: '10' },
      [{ productId: 'product-a', quantity: 1, unitPrice: '10', subtotal: '10' }],
      audit('order.created'),
    ),
    /deliberate audit failure/,
  );
  assert.deepEqual(await storage.getOrdersByCustomer('patient-a'), []);
  assert.equal((await storage.getStockBatchesByProduct('product-a'))[0].quantityReserved, 0);
  assert.deepEqual(await storage.getStockMovements({ batchId: batch.id }), []);
});

test('stock receipt and adjustment roll back when audit insertion fails', async () => {
  const storage = new FailingAuditStorage();
  await assert.rejects(
    storage.createStockBatchWithAudit({
      productId: 'product-a', branchId: 'branch-a', batchNumber: 'RECEIPT', quantityOnHand: 5,
      expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
    }, audit('stock.received')),
    /deliberate audit failure/,
  );
  assert.deepEqual(await storage.getStockBatchesByProduct('product-a'), []);
  assert.deepEqual(await storage.getStockMovements(), []);

  const batch = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'ADJUST', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  await assert.rejects(
    storage.adjustStockBatchWithAudit(batch.id, 'branch-a', -2, 'Damaged during handling', audit('stock.adjusted')),
    /deliberate audit failure/,
  );
  assert.equal((await storage.getStockBatchesByProduct('product-a'))[0].quantityOnHand, 5);
  assert.deepEqual(await storage.getStockMovements(), []);
});

test('stock adjustments require branch ownership, preserve nonnegative balances, and append evidence', async () => {
  const storage = new MemoryStorage();
  const batch = await storage.createStockBatchWithAudit({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  }, audit('stock.received'));

  assert.equal(await storage.adjustStockBatchWithAudit(batch.id, 'branch-b', -1, 'Physical count correction', audit('stock.adjusted')), undefined);
  await assert.rejects(
    storage.adjustStockBatchWithAudit(batch.id, 'branch-a', -6, 'Physical count correction', audit('stock.adjusted')),
    /invalid balance/,
  );
  const adjusted = await storage.adjustStockBatchWithAudit(batch.id, 'branch-a', -2, 'Physical count correction', audit('stock.adjusted'));
  assert.equal(adjusted?.quantityOnHand, 3);
  assert.deepEqual((await storage.getStockMovements({ batchId: batch.id }))
    .map((movement) => [movement.movementType, movement.quantityDelta, movement.balanceAfter] as const)
    .sort(([left], [right]) => left.localeCompare(right)), [
    ['adjustment', -2, 3],
    ['receipt', 5, 5],
  ]);
  assert.deepEqual((await storage.getAuditLogs()).map((entry) => entry.action).sort(), ['stock.adjusted', 'stock.received']);
});

test('order reservation uses FEFO batches and records immutable movement balances', async () => {
  const storage = new MemoryStorage();
  const later = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'LATER', quantityOnHand: 5,
    expiryDate: new Date('2031-01-01T00:00:00.000Z'), costPrice: '5',
  });
  const earlier = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'EARLIER', quantityOnHand: 2,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  const created = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', subtotal: '40', total: '40' },
    [{ productId: 'product-a', quantity: 4, unitPrice: '10', subtotal: '40' }],
    audit('order.created'),
  );

  assert.deepEqual(created.items.map((item) => [item.batchId, item.quantity]), [[earlier.id, 2], [later.id, 2]]);
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((batch) => batch.id === earlier.id)?.quantityReserved, 2);
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((batch) => batch.id === later.id)?.quantityReserved, 2);
  assert.deepEqual((await storage.getStockMovements()).map((movement) => movement.balanceAfter).sort(), [0, 3]);
});

test('insufficient eligible stock rolls back reservations and rejects quarantined batches', async () => {
  const storage = new MemoryStorage();
  const active = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'ACTIVE', quantityOnHand: 2,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'QUARANTINED', quantityOnHand: 100,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5', status: 'quarantined',
  });

  await assert.rejects(
    storage.createOrderWithItemsAndAudit(
      { customerId: 'patient-a', branchId: 'branch-a', subtotal: '30', total: '30' },
      [{ productId: 'product-a', quantity: 3, unitPrice: '10', subtotal: '30' }],
      audit('order.created'),
    ),
    /Insufficient eligible stock/,
  );
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((batch) => batch.id === active.id)?.quantityReserved, 0);
  assert.deepEqual(await storage.getStockMovements(), []);
  assert.deepEqual(await storage.getOrdersByCustomer('patient-a'), []);
});

test('order cancellation releases reservations without changing physical stock and is idempotent', async () => {
  const storage = new MemoryStorage();
  const batch = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  const created = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', subtotal: '20', total: '20' },
    [{ productId: 'product-a', quantity: 2, unitPrice: '10', subtotal: '20' }],
    audit('order.created'),
  );
  const cancellationInput = {
    orderId: created.order.id, actorId: 'patient-a', reasonCode: 'CUSTOMER_REQUEST',
    reason: 'Customer requested cancellation before dispensing.', idempotencyKey: 'cancel-order-key-001', correlationId: 'request-001',
  };
  const cancelled = await storage.cancelOrderWithAudit(cancellationInput, audit('order.cancelled'));
  assert.equal(cancelled.order.status, 'cancelled');
  assert.equal(cancelled.releasedReservations[0].quantityReleased, 2);
  const after = (await storage.getStockBatchesByProduct('product-a')).find((item) => item.id === batch.id);
  assert.equal(after?.quantityOnHand, 5);
  assert.equal(after?.quantityReserved, 0);
  const movementCount = (await storage.getStockMovements({ batchId: batch.id })).length;

  const replay = await storage.cancelOrderWithAudit(cancellationInput, audit('order.cancelled'));
  assert.equal(replay.idempotentReplay, true);
  assert.equal((await storage.getStockMovements({ batchId: batch.id })).length, movementCount);
  await assert.rejects(
    storage.cancelOrderWithAudit({ ...cancellationInput, idempotencyKey: 'different-retry-key' }, audit('order.cancelled')),
    /already been cancelled/,
  );
});

test('cancellation rejects terminal orders and rolls back releases when audit insertion fails', async () => {
  const terminalStorage = new MemoryStorage();
  const delivered = await terminalStorage.createOrder({ customerId: 'patient-a', branchId: 'branch-a', subtotal: '10', total: '10', status: 'delivered' });
  await assert.rejects(
    terminalStorage.cancelOrderWithAudit({
      orderId: delivered.id, actorId: 'patient-a', reasonCode: 'CUSTOMER_REQUEST', reason: 'Customer requested cancellation.', idempotencyKey: 'terminal-key-001',
    }, audit('order.cancelled')),
    /cannot be cancelled/,
  );

  const storage = new FailingAuditStorage();
  const batch = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  storage.failAudit = false;
  const created = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', subtotal: '20', total: '20' },
    [{ productId: 'product-a', quantity: 2, unitPrice: '10', subtotal: '20' }],
    { userId: 'patient-a', action: 'seed.order', entityType: 'order' },
  );
  storage.failAudit = true;
  await assert.rejects(
    storage.cancelOrderWithAudit({
      orderId: created.order.id, actorId: 'patient-a', reasonCode: 'CUSTOMER_REQUEST',
      reason: 'Customer requested cancellation before dispensing.', idempotencyKey: 'rollback-key-001',
    }, audit('order.cancelled')),
    /deliberate audit failure/,
  );
  assert.equal((await storage.getOrder(created.order.id))?.status, 'pending');
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((item) => item.id === batch.id)?.quantityReserved, 2);
  assert.equal((await storage.getReservationsByOrder(created.order.id))[0].quantityReleased, 0);
  assert.equal((await storage.getStockMovements({ batchId: batch.id })).filter((movement) => movement.movementType === 'release').length, 0);
});

test('concurrent cancellation attempts release each reservation only once', async () => {
  const storage = new MemoryStorage();
  const batch = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  const created = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', subtotal: '20', total: '20' },
    [{ productId: 'product-a', quantity: 2, unitPrice: '10', subtotal: '20' }],
    audit('order.created'),
  );
  const base = {
    orderId: created.order.id, actorId: 'patient-a', reasonCode: 'CUSTOMER_REQUEST',
    reason: 'Customer requested cancellation before dispensing.',
  };
  const results = await Promise.allSettled([
    storage.cancelOrderWithAudit({ ...base, idempotencyKey: 'concurrent-key-001' }, audit('order.cancelled')),
    storage.cancelOrderWithAudit({ ...base, idempotencyKey: 'concurrent-key-002' }, audit('order.cancelled')),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((item) => item.id === batch.id)?.quantityReserved, 0);
  assert.equal((await storage.getStockMovements({ batchId: batch.id })).filter((movement) => movement.movementType === 'release').length, 1);
});

test('cancelling a partially dispensed order releases only the unfulfilled reservation balance', async () => {
  const storage = new MemoryStorage();
  const batch = await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  const created = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', subtotal: '20', total: '20' },
    [{ productId: 'product-a', quantity: 2, unitPrice: '10', subtotal: '20' }],
    audit('order.created'),
  );
  const [reservation] = await storage.getReservationsByOrder(created.order.id);
  reservation.quantityDispensed = 1;
  reservation.status = 'partially_dispensed';
  const storedBatch = (await storage.getStockBatchesByProduct('product-a')).find((item) => item.id === batch.id)!;
  storedBatch.quantityOnHand = 4;
  storedBatch.quantityReserved = 1;

  const cancelled = await storage.cancelOrderWithAudit({
    orderId: created.order.id, actorId: 'pharmacist-a', reasonCode: 'OPERATIONAL',
    reason: 'Remaining quantity cancelled after partial dispensing.', idempotencyKey: 'partial-cancel-key-001',
  }, audit('order.cancelled'));
  assert.equal(cancelled.order.status, 'partially_cancelled');
  assert.equal(cancelled.releasedReservations[0].quantityReleased, 1);
  assert.equal(storedBatch.quantityOnHand, 4);
  assert.equal((await storage.getStockBatchesByProduct('product-a')).find((item) => item.id === batch.id)?.quantityReserved, 0);
  assert.equal((await storage.getReservationsByOrder(created.order.id))[0].quantityDispensed, 1);
});

test('prescription approval gates partial and full dispensing with idempotent stock transitions', async () => {
  const storage = new MemoryStorage();
  const product = await storage.createProduct({ sku: 'RX-1', name: 'Prescription medicine', price: '10', prescriptionRequired: true, prescriptionRequirement: 'prescription_required', requiresPharmacistApproval: true });
  const prescription = await storage.createPrescription({ patientId: 'patient-a', status: 'pending', expiresAt: new Date('2030-01-01T00:00:00.000Z'), prescribedMedications: [{ productId: product.id, quantity: 4 }] });
  const batch = await storage.createStockBatch({ productId: product.id, branchId: 'branch-a', batchNumber: 'RX-BATCH', quantityOnHand: 5, expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5' });
  const created = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', prescriptionId: prescription.id, subtotal: '40', total: '40' },
    [{ productId: product.id, quantity: 4, unitPrice: '10', subtotal: '40', prescriptionLink: { prescriptionId: prescription.id, prescribedQuantity: 4 } }], audit('order.created'),
  );
  const item = created.items[0];
  const reservation = (await storage.getReservationsByOrder(created.order.id))[0];
  await assert.rejects(storage.dispenseOrderItem({ orderId: created.order.id, orderItemId: item.id, reservationId: reservation.id, quantity: 1, actorId: 'pharmacist-a', idempotencyKey: 'dispense-before-approval', counsellingCompleted: true }, audit('dispensing.completed')), /Approved prescription/);
  const link = await storage.reviewPrescriptionOrderItem({ prescriptionId: prescription.id, orderItemId: item.id, actorId: 'pharmacist-a', decision: 'approve', authorisedQuantity: 4 }, audit('prescription.item.approve'));
  assert.equal(link.authorisedQuantity, 4);
  const first = await storage.dispenseOrderItem({ orderId: created.order.id, orderItemId: item.id, reservationId: reservation.id, quantity: 2, actorId: 'pharmacist-a', idempotencyKey: 'dispense-partial-001', counsellingCompleted: true }, audit('dispensing.completed'));
  assert.equal(first.item.status, 'partially_fulfilled');
  assert.equal(first.reservation.status, 'partially_dispensed');
  const replay = await storage.dispenseOrderItem({ orderId: created.order.id, orderItemId: item.id, reservationId: reservation.id, quantity: 2, actorId: 'pharmacist-a', idempotencyKey: 'dispense-partial-001', counsellingCompleted: true }, audit('dispensing.completed'));
  assert.equal(replay.idempotentReplay, true);
  assert.equal((await storage.getStockBatchesByProduct(product.id))[0].quantityOnHand, 3);
  const final = await storage.dispenseOrderItem({ orderId: created.order.id, orderItemId: item.id, reservationId: reservation.id, quantity: 2, actorId: 'pharmacist-a', idempotencyKey: 'dispense-final-002', counsellingCompleted: true }, audit('dispensing.completed'));
  assert.equal(final.order.status, 'fully_dispensed');
  assert.equal(final.item.status, 'fulfilled');
  assert.equal((await storage.getStockBatchesByProduct(product.id))[0].quantityOnHand, 1);
  assert.equal((await storage.getStockBatchesByProduct(product.id))[0].quantityReserved, 0);
  assert.equal((await storage.getStockMovements({ batchId: batch.id })).filter((movement) => movement.movementType === 'dispense').length, 2);
});

test('prescription quantity and blocked-batch controls reject unsafe dispensing', async () => {
  const storage = new MemoryStorage();
  const product = await storage.createProduct({ sku: 'RX-2', name: 'Controlled medicine', price: '10', prescriptionRequired: true, prescriptionRequirement: 'controlled_medicine', requiresPharmacistApproval: true, controlledMedicine: true });
  const prescription = await storage.createPrescription({ patientId: 'patient-a', status: 'pending', expiresAt: new Date('2030-01-01T00:00:00.000Z') });
  await storage.createStockBatch({ productId: product.id, branchId: 'branch-a', batchNumber: 'RX-2-BATCH', quantityOnHand: 3, expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5' });
  const created = await storage.createOrderWithItemsAndAudit({ customerId: 'patient-a', branchId: 'branch-a', prescriptionId: prescription.id, subtotal: '30', total: '30' }, [{ productId: product.id, quantity: 3, unitPrice: '10', subtotal: '30', prescriptionLink: { prescriptionId: prescription.id, prescribedQuantity: 3 } }], audit('order.created'));
  const item = created.items[0];
  const reservation = (await storage.getReservationsByOrder(created.order.id))[0];
  await assert.rejects(storage.reviewPrescriptionOrderItem({ prescriptionId: prescription.id, orderItemId: item.id, actorId: 'pharmacist-a', decision: 'approve', authorisedQuantity: 4 }, audit('prescription.item.approve')), /exceeds/);
  await storage.reviewPrescriptionOrderItem({ prescriptionId: prescription.id, orderItemId: item.id, actorId: 'pharmacist-a', decision: 'partially_approve', authorisedQuantity: 2 }, audit('prescription.item.partially_approve'));
  await assert.rejects(storage.dispenseOrderItem({ orderId: created.order.id, orderItemId: item.id, reservationId: reservation.id, quantity: 3, actorId: 'pharmacist-a', idempotencyKey: 'dispense-controlled-without-authorisation', counsellingCompleted: true }, audit('dispensing.completed')), /Controlled-medicine/);
  await assert.rejects(storage.dispenseOrderItem({ orderId: created.order.id, orderItemId: item.id, reservationId: reservation.id, quantity: 3, actorId: 'pharmacist-a', idempotencyKey: 'dispense-over-authorised', counsellingCompleted: true, controlledMedicineAuthorized: true }, audit('dispensing.completed')), /prescription quantity/);
  const batch = (await storage.getStockBatchesByProduct(product.id))[0];
  await storage.updateStockBatch(batch.id, { status: 'quarantined' });
  await assert.rejects(storage.dispenseOrderItem({ orderId: created.order.id, orderItemId: item.id, reservationId: reservation.id, quantity: 1, actorId: 'pharmacist-a', idempotencyKey: 'dispense-quarantined', counsellingCompleted: true, controlledMedicineAuthorized: true }, audit('dispensing.completed')), /expired or blocked/);
});

test('dispensing audit failure rolls back stock, reservation, item, and dispensing evidence', async () => {
  const storage = new FailingAuditStorage();
  storage.failAudit = false;
  const product = await storage.createProduct({ sku: 'OTC-ROLLBACK', name: 'Rollback medicine', price: '10' });
  await storage.createStockBatch({ productId: product.id, branchId: 'branch-a', batchNumber: 'ROLLBACK', quantityOnHand: 2, expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5' });
  const created = await storage.createOrderWithItemsAndAudit({ customerId: 'patient-a', branchId: 'branch-a', subtotal: '20', total: '20' }, [{ productId: product.id, quantity: 2, unitPrice: '10', subtotal: '20' }], audit('order.created'));
  const reservation = (await storage.getReservationsByOrder(created.order.id))[0];
  storage.failAudit = true;
  await assert.rejects(storage.dispenseOrderItem({ orderId: created.order.id, orderItemId: created.items[0].id, reservationId: reservation.id, quantity: 1, actorId: 'pharmacist-a', idempotencyKey: 'dispense-rollback-001', counsellingCompleted: true }, audit('dispensing.completed')), /deliberate audit failure/);
  assert.equal((await storage.getStockBatchesByProduct(product.id))[0].quantityOnHand, 2);
  assert.equal((await storage.getStockBatchesByProduct(product.id))[0].quantityReserved, 2);
  assert.equal((await storage.getReservationsByOrder(created.order.id))[0].quantityDispensed, 0);
  assert.equal((await storage.getOrderItems(created.order.id))[0].quantityDispensed, 0);
  assert.equal((await storage.getStockMovements()).filter((movement) => movement.movementType === 'dispense').length, 0);
});

test('prescription revocation releases only the undispensed balance and preserves physical stock', async () => {
  const storage = new MemoryStorage();
  const product = await storage.createProduct({ sku: 'RX-REVOKE', name: 'Revocable medicine', price: '10', prescriptionRequired: true, prescriptionRequirement: 'prescription_required', requiresPharmacistApproval: true });
  const prescription = await storage.createPrescription({ patientId: 'patient-a', status: 'pending', expiresAt: new Date('2030-01-01T00:00:00.000Z') });
  await storage.createStockBatch({ productId: product.id, branchId: 'branch-a', batchNumber: 'REVOKE', quantityOnHand: 5, expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5' });
  const created = await storage.createOrderWithItemsAndAudit({ customerId: 'patient-a', branchId: 'branch-a', prescriptionId: prescription.id, subtotal: '40', total: '40' }, [{ productId: product.id, quantity: 4, unitPrice: '10', subtotal: '40', prescriptionLink: { prescriptionId: prescription.id, prescribedQuantity: 4 } }], audit('order.created'));
  const item = created.items[0];
  const reservation = (await storage.getReservationsByOrder(created.order.id))[0];
  await storage.reviewPrescriptionOrderItem({ prescriptionId: prescription.id, orderItemId: item.id, actorId: 'pharmacist-a', decision: 'approve', authorisedQuantity: 4 }, audit('prescription.item.approve'));
  await storage.dispenseOrderItem({ orderId: created.order.id, orderItemId: item.id, reservationId: reservation.id, quantity: 1, actorId: 'pharmacist-a', idempotencyKey: 'revoke-partial-dispense', counsellingCompleted: true }, audit('dispensing.completed'));
  const revoked = await storage.revokePrescriptionWithAudit({ prescriptionId: prescription.id, actorId: 'pharmacist-a', reason: 'Prescriber withdrew the remaining authorised medicine.', correlationId: 'revoke-request-1' }, audit('prescription.revoked'));
  assert.equal(revoked.prescription.status, 'revoked');
  assert.equal(revoked.releasedReservations[0].quantityReleased, 3);
  assert.equal((await storage.getStockBatchesByProduct(product.id))[0].quantityOnHand, 4);
  assert.equal((await storage.getStockBatchesByProduct(product.id))[0].quantityReserved, 0);
  assert.equal((await storage.getReservationsByOrder(created.order.id))[0].quantityDispensed, 1);
  assert.equal((await storage.getReservationsByOrder(created.order.id))[0].quantityReleased, 3);
  assert.equal((await storage.getOrderItems(created.order.id))[0].status, 'cancelled');
  assert.equal((await storage.getOrder(created.order.id))?.status, 'partially_cancelled');
  const replay = await storage.revokePrescriptionWithAudit({ prescriptionId: prescription.id, actorId: 'pharmacist-a', reason: 'Prescriber withdrew the remaining authorised medicine.' }, audit('prescription.revoked'));
  assert.deepEqual(replay.releasedReservations, []);
});

test('prescription revocation audit failure rolls back link, reservation, stock, and status', async () => {
  const storage = new FailingAuditStorage();
  storage.failAudit = false;
  const product = await storage.createProduct({ sku: 'RX-REVOKE-ROLLBACK', name: 'Rollback prescription medicine', price: '10', prescriptionRequired: true, prescriptionRequirement: 'prescription_required', requiresPharmacistApproval: true });
  const prescription = await storage.createPrescription({ patientId: 'patient-a', status: 'approved' });
  await storage.createStockBatch({ productId: product.id, branchId: 'branch-a', batchNumber: 'REVOKE-ROLLBACK', quantityOnHand: 2, expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5' });
  const created = await storage.createOrderWithItemsAndAudit({ customerId: 'patient-a', branchId: 'branch-a', prescriptionId: prescription.id, subtotal: '20', total: '20' }, [{ productId: product.id, quantity: 2, unitPrice: '10', subtotal: '20', prescriptionLink: { prescriptionId: prescription.id, prescribedQuantity: 2 } }], audit('order.created'));
  storage.failAudit = true;
  await assert.rejects(storage.revokePrescriptionWithAudit({ prescriptionId: prescription.id, actorId: 'pharmacist-a', reason: 'Clinical review requires immediate approval withdrawal.' }, audit('prescription.revoked')), /deliberate audit failure/);
  assert.equal((await storage.getPrescription(prescription.id))?.status, 'approved');
  assert.equal((await storage.getReservationsByOrder(created.order.id))[0].quantityReleased, 0);
  assert.equal((await storage.getStockBatchesByProduct(product.id))[0].quantityReserved, 2);
  assert.equal((await storage.getPrescriptionOrderItems(prescription.id))[0].approvalStatus, 'pending');
  assert.equal((await storage.getOrder(created.order.id))?.status, 'pending');
});

test('concurrent prescription revocation and dispensing produce one valid stock transition', async () => {
  const storage = new MemoryStorage();
  const product = await storage.createProduct({ sku: 'RX-REVOKE-RACE', name: 'Concurrent revocation medicine', price: '10', prescriptionRequired: true, prescriptionRequirement: 'prescription_required', requiresPharmacistApproval: true });
  const prescription = await storage.createPrescription({ patientId: 'patient-a', status: 'approved', expiresAt: new Date('2030-01-01T00:00:00.000Z') });
  await storage.createStockBatch({ productId: product.id, branchId: 'branch-a', batchNumber: 'REVOKE-RACE', quantityOnHand: 2, expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5' });
  const created = await storage.createOrderWithItemsAndAudit({ customerId: 'patient-a', branchId: 'branch-a', prescriptionId: prescription.id, subtotal: '20', total: '20' }, [{ productId: product.id, quantity: 2, unitPrice: '10', subtotal: '20', prescriptionLink: { prescriptionId: prescription.id, prescribedQuantity: 2 } }], audit('order.created'));
  const item = created.items[0];
  const reservation = (await storage.getReservationsByOrder(created.order.id))[0];
  await storage.reviewPrescriptionOrderItem({ prescriptionId: prescription.id, orderItemId: item.id, actorId: 'pharmacist-a', decision: 'approve', authorisedQuantity: 2 }, audit('prescription.item.approve'));
  const results = await Promise.allSettled([
    storage.revokePrescriptionWithAudit({ prescriptionId: prescription.id, actorId: 'pharmacist-a', reason: 'Clinical reassessment requires immediate prescription revocation.' }, audit('prescription.revoked')),
    storage.dispenseOrderItem({ orderId: created.order.id, orderItemId: item.id, reservationId: reservation.id, quantity: 2, actorId: 'pharmacist-b', idempotencyKey: 'dispense-versus-revoke', counsellingCompleted: true }, audit('dispensing.completed')),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
  const batch = (await storage.getStockBatchesByProduct(product.id))[0];
  assert.equal(batch.quantityReserved, 0);
  assert.equal(batch.quantityOnHand, 2);
  assert.equal((await storage.getStockMovements()).filter((movement) => ['release', 'dispense'].includes(movement.movementType)).length, 1);
});

test('batch substitution atomically moves remaining reservations and is idempotent', async () => {
  const storage = new MemoryStorage();
  const product = await storage.createProduct({ sku: 'SUB-1', name: 'Substitutable medicine', price: '10' });
  const original = await storage.createStockBatch({ productId: product.id, branchId: 'branch-a', batchNumber: 'ORIGINAL', quantityOnHand: 3, expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5' });
  const substitute = await storage.createStockBatch({ productId: product.id, branchId: 'branch-a', batchNumber: 'SUBSTITUTE', quantityOnHand: 5, expiryDate: new Date('2031-01-01T00:00:00.000Z'), costPrice: '5' });
  const created = await storage.createOrderWithItemsAndAudit({ customerId: 'patient-a', branchId: 'branch-a', subtotal: '20', total: '20' }, [{ productId: product.id, batchId: original.id, quantity: 2, unitPrice: '10', subtotal: '20' }], audit('order.created'));
  const reservation = (await storage.getReservationsByOrder(created.order.id))[0];
  const input = { orderId: created.order.id, orderItemId: created.items[0].id, reservationId: reservation.id, substituteBatchId: substitute.id, actorId: 'pharmacist-a', reason: 'Original batch packaging integrity requires replacement before dispensing.', idempotencyKey: 'substitution-request-001' };
  const result = await storage.substituteReservationBatch(input, audit('inventory.batch_substituted'));
  assert.equal(result.substitution.quantity, 2);
  assert.equal(result.originalReservation.status, 'released');
  assert.equal(result.substituteReservation.quantityReserved, 2);
  assert.equal((await storage.getStockBatchesByProduct(product.id)).find((batch) => batch.id === original.id)?.quantityReserved, 0);
  assert.equal((await storage.getStockBatchesByProduct(product.id)).find((batch) => batch.id === substitute.id)?.quantityReserved, 2);
  assert.equal((await storage.getOrderItems(created.order.id))[0].batchId, substitute.id);
  assert.equal((await storage.getStockMovements()).filter((movement) => ['release', 'reservation'].includes(movement.movementType)).length, 3);
  const replay = await storage.substituteReservationBatch(input, audit('inventory.batch_substituted'));
  assert.equal(replay.idempotentReplay, true);
  assert.equal((await storage.getReservationsByOrder(created.order.id)).length, 2);
});

test('batch substitution rejects unrelated batches and rolls back when audit insertion fails', async () => {
  const storage = new FailingAuditStorage();
  storage.failAudit = false;
  const product = await storage.createProduct({ sku: 'SUB-2', name: 'Original medicine', price: '10' });
  const otherProduct = await storage.createProduct({ sku: 'SUB-OTHER', name: 'Different medicine', price: '10' });
  const original = await storage.createStockBatch({ productId: product.id, branchId: 'branch-a', batchNumber: 'ORIGINAL-2', quantityOnHand: 2, expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5' });
  const valid = await storage.createStockBatch({ productId: product.id, branchId: 'branch-a', batchNumber: 'VALID-2', quantityOnHand: 2, expiryDate: new Date('2031-01-01T00:00:00.000Z'), costPrice: '5' });
  const unrelated = await storage.createStockBatch({ productId: otherProduct.id, branchId: 'branch-a', batchNumber: 'UNRELATED', quantityOnHand: 2, expiryDate: new Date('2031-01-01T00:00:00.000Z'), costPrice: '5' });
  const created = await storage.createOrderWithItemsAndAudit({ customerId: 'patient-a', branchId: 'branch-a', subtotal: '20', total: '20' }, [{ productId: product.id, batchId: original.id, quantity: 2, unitPrice: '10', subtotal: '20' }], audit('order.created'));
  const reservation = (await storage.getReservationsByOrder(created.order.id))[0];
  const base = { orderId: created.order.id, orderItemId: created.items[0].id, reservationId: reservation.id, actorId: 'pharmacist-a', reason: 'Original batch packaging integrity requires replacement before dispensing.' };
  await assert.rejects(storage.substituteReservationBatch({ ...base, substituteBatchId: unrelated.id, idempotencyKey: 'substitution-unrelated' }, audit('inventory.batch_substituted')), /same product/);
  storage.failAudit = true;
  await assert.rejects(storage.substituteReservationBatch({ ...base, substituteBatchId: valid.id, idempotencyKey: 'substitution-rollback' }, audit('inventory.batch_substituted')), /deliberate audit failure/);
  assert.equal((await storage.getStockBatchesByProduct(product.id)).find((batch) => batch.id === original.id)?.quantityReserved, 2);
  assert.equal((await storage.getStockBatchesByProduct(product.id)).find((batch) => batch.id === valid.id)?.quantityReserved, 0);
  assert.equal((await storage.getReservationsByOrder(created.order.id)).length, 1);
  assert.equal((await storage.getOrderItems(created.order.id))[0].batchId, original.id);
});

test('emergency-access activation fails when its audit insert fails', async () => {
  const storage = new FailingAuditStorage();
  await assert.rejects(
    storage.createEmergencyAccessGrantWithAudit({
      actorId: 'doctor-a',
      patientId: 'patient-a',
      reasonCode: 'immediate_threat',
      justification: 'Immediate intervention is required for the patient.',
      activatedAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date('2026-01-01T00:05:00.000Z'),
      reviewState: 'pending',
    }, audit('emergency_access.activated')),
    /deliberate audit failure/,
  );
  assert.ok(storage.lastCreatedGrantId);
  assert.equal(await storage.getEmergencyAccessGrant(storage.lastCreatedGrantId), undefined);
});

test('emergency-access review rolls back when its audit insert fails', async () => {
  const storage = new FailingAuditStorage();
  const grant = await storage.createEmergencyAccessGrant({
    actorId: 'doctor-a',
    patientId: 'patient-a',
    reasonCode: 'continuity_of_care',
    justification: 'Urgent continuity of care requires temporary access.',
    activatedAt: new Date('2026-01-01T00:00:00.000Z'),
    expiresAt: new Date('2026-01-01T00:15:00.000Z'),
    reviewState: 'pending',
  });
  await assert.rejects(
    storage.reviewEmergencyAccessGrantWithAudit(grant.id, {
      reviewState: 'rejected',
      reviewedBy: 'security-admin',
      reviewedAt: new Date('2026-01-01T00:01:00.000Z'),
      reviewNotes: 'The incident record did not justify access.',
    }, audit('emergency_access.rejected')),
    /deliberate audit failure/,
  );
  assert.equal((await storage.getEmergencyAccessGrant(grant.id))?.reviewState, 'pending');
});

test('appointment update rolls back when its audit insert fails', async () => {
  const storage = new FailingAuditStorage();
  const appointment = await storage.createAppointment({
    patientId: 'patient-a',
    scheduledAt: new Date('2026-01-02T09:00:00.000Z'),
    type: 'in-person',
    status: 'scheduled',
  });
  await assert.rejects(
    storage.updateAppointmentWithAudit(appointment.id, { status: 'cancelled' }, audit('appointment.cancelled')),
    /deliberate audit failure/,
  );
  assert.equal((await storage.getAppointment(appointment.id))?.status, 'scheduled');
});

test('stale prescription review cannot overwrite a completed transition', async () => {
  const storage = new MemoryStorage();
  const prescription = await storage.createPrescription({ patientId: 'patient-a', status: 'pending' });
  const approved = await storage.reviewPrescriptionWithAudit(
    prescription.id,
    'pending',
    { status: 'approved' },
    audit('prescription.approved'),
  );
  assert.equal(approved?.status, 'approved');

  const staleReview = await storage.reviewPrescriptionWithAudit(
    prescription.id,
    'pending',
    { status: 'rejected' },
    audit('prescription.rejected'),
  );
  assert.equal(staleReview, undefined);
  assert.equal((await storage.getPrescription(prescription.id))?.status, 'approved');
  assert.deepEqual((await storage.getAuditLogs()).map((entry) => entry.action), ['prescription.approved']);
});

test('successful transactional mutations append audit entries', async () => {
  const storage = new MemoryStorage();
  await storage.upsertUser({ id: 'user-a', role: 'patient' });
  const prescription = await storage.createPrescription({ patientId: 'patient-a', status: 'pending' });
  await storage.createStockBatch({
    productId: 'product-a', branchId: 'branch-a', batchNumber: 'A-1', quantityOnHand: 5,
    expiryDate: new Date('2030-01-01T00:00:00.000Z'), costPrice: '5',
  });
  const createdOrder = await storage.createOrderWithItemsAndAudit(
    { customerId: 'patient-a', branchId: 'branch-a', subtotal: '10', total: '10' },
    [{ productId: 'product-a', quantity: 1, unitPrice: '10', subtotal: '10' }],
    audit('order.created'),
  );
  await storage.assignUserRoleWithAudit('user-a', 'receptionist', 'branch-a', audit('user.role.change'));
  await storage.reviewPrescriptionWithAudit(prescription.id, 'pending', { status: 'approved' }, audit('prescription.review'));
  const logs = await storage.getAuditLogs();
  assert.equal((await storage.getOrderItems(createdOrder.order.id)).length, 1);
  assert.equal(logs.find((entry) => entry.action === 'order.created')?.entityId, createdOrder.order.id);
  assert.deepEqual(logs.map((entry) => entry.action).sort(), ['order.created', 'prescription.review', 'user.role.change']);
});
