import assert from 'node:assert/strict';
import test from 'node:test';
import { MemoryStorage } from './memoryStorage';

test('scoped storage methods never fall back to unrestricted records', async () => {
  const storage = new MemoryStorage();
  const order = await storage.createOrder({ customerId: 'patient-a', branchId: 'branch-a', subtotal: '10', total: '10' });
  const prescription = await storage.createPrescription({ patientId: 'patient-a' });
  const delivery = await storage.createDelivery({ orderId: order.id, driverId: 'driver-a' });
  const appointment = await storage.createAppointment({ patientId: 'patient-a', scheduledAt: new Date(), type: 'in-person' });

  assert.equal((await storage.getOrderForOwner(order.id, 'patient-a'))?.id, order.id);
  assert.equal(await storage.getOrderForOwner(order.id, 'patient-b'), undefined);
  assert.equal(await storage.getOrderForOwner(order.id, ''), undefined);
  assert.equal((await storage.getOrderWithinBranch(order.id, 'branch-a'))?.id, order.id);
  assert.equal(await storage.getOrderWithinBranch(order.id, 'branch-b'), undefined);

  assert.equal((await storage.getPrescriptionForPatient(prescription.id, 'patient-a'))?.id, prescription.id);
  assert.equal(await storage.getPrescriptionForPatient(prescription.id, 'patient-b'), undefined);
  assert.equal((await storage.getAssignedDelivery(delivery.id, 'driver-a'))?.id, delivery.id);
  assert.equal(await storage.getAssignedDelivery(delivery.id, 'driver-b'), undefined);
  assert.equal((await storage.getAppointmentForPatient(appointment.id, 'patient-a'))?.id, appointment.id);
  assert.equal(await storage.getAppointmentForPatient(appointment.id, 'patient-b'), undefined);
});
