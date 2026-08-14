import assert from 'node:assert/strict';
import test from 'node:test';
import { canRoleAssign, hasPermission, PERMISSIONS } from '@shared/healthcareAccess';
import {
  canDispensePrescription, canInitiatePayment, canIssuePrescription,
  canManageAppointment, canManageDelivery, canPublishLabResult,
  canReadOrder, canReadPatientRecord, canUpdatePatientRecord,
  canWriteClinicalNote, type Principal,
} from './authorization';

const user = (role: string, id = `${role}-1`, branchId = 'branch-a'): Principal => ({ id, role, branchId });
const patient = user('patient', 'patient-a');

test('patient access is limited to owned records and permitted profile fields', () => {
  assert.equal(canReadPatientRecord(patient, { patientId: patient.id }), true);
  assert.equal(canReadPatientRecord(patient, { patientId: 'patient-b' }), false);
  assert.equal(canUpdatePatientRecord(patient, { patientId: patient.id }), true);
  assert.equal(canUpdatePatientRecord(patient, { patientId: 'patient-b' }), false);
  assert.equal(hasPermission(patient.role, PERMISSIONS.AUDIT_LOG_VIEW), false);
});

test('doctor clinical actions require patient assignment', () => {
  const doctor = user('doctor');
  const assigned = { patientId: patient.id, assignedClinicianIds: [doctor.id] };
  assert.equal(canReadPatientRecord(doctor, assigned), true);
  assert.equal(canWriteClinicalNote(doctor, assigned), true);
  assert.equal(canIssuePrescription(doctor, assigned), true);
  assert.equal(canReadPatientRecord(doctor, { patientId: patient.id }), false);
  assert.equal(canDispensePrescription(doctor, assigned), false);
});

test('nurse can document assigned care but cannot prescribe', () => {
  const nurse = user('nurse');
  const assigned = { patientId: patient.id, assignedClinicianIds: [nurse.id] };
  assert.equal(canWriteClinicalNote(nurse, assigned), true);
  assert.equal(canIssuePrescription(nurse, assigned), false);
  assert.equal(canPublishLabResult(nurse, { branchId: nurse.branchId }), false);
});

test('pharmacist dispenses only approved prescriptions in their branch', () => {
  const pharmacist = user('pharmacist');
  assert.equal(canDispensePrescription(pharmacist, { branchId: 'branch-a', recordStatus: 'approved' }), true);
  assert.equal(canDispensePrescription(pharmacist, { branchId: 'branch-b', recordStatus: 'approved' }), false);
  assert.equal(canDispensePrescription(pharmacist, { branchId: 'branch-a', recordStatus: 'pending' }), false);
  assert.equal(canIssuePrescription(pharmacist, { assignedClinicianIds: [pharmacist.id] }), false);
});

test('receptionist appointment access is branch-scoped and non-clinical', () => {
  const receptionist = user('receptionist');
  assert.equal(canManageAppointment(receptionist, { branchId: 'branch-a', patientId: patient.id }), true);
  assert.equal(canManageAppointment(receptionist, { branchId: 'branch-b', patientId: patient.id }), false);
  assert.equal(canWriteClinicalNote(receptionist, { assignedClinicianIds: [receptionist.id] }), false);
});

test('laboratory staff publishes only unpublished results in their branch', () => {
  const laboratory = user('laboratory_staff');
  assert.equal(canPublishLabResult(laboratory, { branchId: 'branch-a', recordStatus: 'draft' }), true);
  assert.equal(canPublishLabResult(laboratory, { branchId: 'branch-a', recordStatus: 'published' }), false);
  assert.equal(canPublishLabResult(laboratory, { branchId: 'branch-b', recordStatus: 'draft' }), false);
});

test('delivery drivers see and update only assigned deliveries', () => {
  const driver = user('delivery_driver');
  assert.equal(canManageDelivery(driver, { assignedDriverId: driver.id }), true);
  assert.equal(canManageDelivery(driver, { assignedDriverId: 'other-driver' }), false);
  assert.equal(canReadPatientRecord(driver, { patientId: patient.id }), false);
});

test('orders and payments preserve ownership and branch boundaries', () => {
  const branchAdmin = user('branch_administrator');
  assert.equal(canReadOrder(patient, { customerId: patient.id, branchId: 'branch-b' }), true);
  assert.equal(canReadOrder(patient, { customerId: 'patient-b', branchId: 'branch-a' }), false);
  assert.equal(canReadOrder(branchAdmin, { customerId: patient.id, branchId: 'branch-a' }), true);
  assert.equal(canReadOrder(branchAdmin, { customerId: patient.id, branchId: 'branch-b' }), false);
  assert.equal(canInitiatePayment(patient, { ownerId: patient.id, recordStatus: 'pending' }), true);
  assert.equal(canInitiatePayment(patient, { ownerId: 'patient-b', recordStatus: 'pending' }), false);
});

test('role assignment follows administrative hierarchy', () => {
  assert.equal(canRoleAssign('branch_administrator', 'delivery_driver'), true);
  assert.equal(canRoleAssign('branch_administrator', 'system_administrator'), false);
  assert.equal(canRoleAssign('system_administrator', 'branch_administrator'), true);
  assert.equal(canRoleAssign('system_administrator', 'super_administrator'), false);
  assert.equal(canRoleAssign('super_administrator', 'system_administrator'), true);
  assert.equal(canRoleAssign('super_administrator', 'super_administrator'), false);
  assert.equal(canRoleAssign('patient', 'doctor'), false);
});

test('administrative roles do not silently receive clinical permissions', () => {
  for (const role of ['branch_administrator', 'system_administrator', 'super_administrator']) {
    const administrator = user(role);
    assert.equal(canReadPatientRecord(administrator, { patientId: patient.id }), false);
    assert.equal(canWriteClinicalNote(administrator, { assignedClinicianIds: [administrator.id] }), false);
    assert.equal(canIssuePrescription(administrator, { assignedClinicianIds: [administrator.id] }), false);
  }
});

test('break-glass access requires reason, elevated authentication, and an unexpired grant', () => {
  const doctor = user('doctor');
  const base = { patientId: patient.id, emergencyAccess: { active: true, elevatedAuth: true, reason: 'Immediate life-threatening care', expiresAt: new Date(Date.now() + 60_000) } };
  assert.equal(canReadPatientRecord(doctor, base), true);
  assert.equal(canReadPatientRecord(doctor, { ...base, emergencyAccess: { ...base.emergencyAccess, reason: '' } }), false);
  assert.equal(canReadPatientRecord(doctor, { ...base, emergencyAccess: { ...base.emergencyAccess, elevatedAuth: false } }), false);
  assert.equal(canReadPatientRecord(doctor, { ...base, emergencyAccess: { ...base.emergencyAccess, expiresAt: new Date(0) } }), false);
});
