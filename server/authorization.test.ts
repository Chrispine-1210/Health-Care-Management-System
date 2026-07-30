import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canCreateAppointmentFor,
  canReadOrder,
  canReadPatientData,
  canUpdateAppointment,
  canUpdateOrder,
} from './authorization';

const customer = { id: 'patient-a', role: 'customer' };
const otherCustomer = { id: 'patient-b', role: 'customer' };
const pharmacist = { id: 'pharmacist-a', role: 'pharmacist' };
const driver = { id: 'driver-a', role: 'driver' };

test('customers can only read their own orders', () => {
  assert.equal(canReadOrder(customer, { customerId: customer.id }), true);
  assert.equal(canReadOrder(otherCustomer, { customerId: customer.id }), false);
  assert.equal(canReadOrder(driver, { customerId: customer.id }), false);
  assert.equal(canReadOrder(pharmacist, { customerId: customer.id }), true);
});

test('only clinical operations roles can update orders', () => {
  assert.equal(canUpdateOrder(customer), false);
  assert.equal(canUpdateOrder(driver), false);
  assert.equal(canUpdateOrder(pharmacist), true);
});

test('patient data is limited to the patient and clinical operations roles', () => {
  assert.equal(canReadPatientData(customer, customer.id), true);
  assert.equal(canReadPatientData(otherCustomer, customer.id), false);
  assert.equal(canReadPatientData(driver, customer.id), false);
  assert.equal(canReadPatientData(pharmacist, customer.id), true);
});

test('appointment creation and updates enforce patient boundaries', () => {
  assert.equal(canCreateAppointmentFor(customer, customer.id), true);
  assert.equal(canCreateAppointmentFor(customer, otherCustomer.id), false);
  assert.equal(canCreateAppointmentFor(pharmacist, customer.id), true);
  assert.equal(canUpdateAppointment(customer, { patientId: customer.id }), false);
  assert.equal(canUpdateAppointment(pharmacist, { patientId: customer.id }), true);
});
