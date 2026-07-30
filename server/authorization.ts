export type Principal = { id: string; role: string };

const CLINICAL_ROLES = new Set(['admin', 'pharmacist', 'staff']);

export function canReadOrder(user: Principal, order: { customerId: string }): boolean {
  return user.id === order.customerId || CLINICAL_ROLES.has(user.role);
}

export function canUpdateOrder(user: Principal): boolean {
  return CLINICAL_ROLES.has(user.role);
}

export function canReadPatientData(user: Principal, patientId: string): boolean {
  return user.id === patientId || CLINICAL_ROLES.has(user.role);
}

export function canUpdateAppointment(user: Principal, _appointment: { patientId: string }): boolean {
  return CLINICAL_ROLES.has(user.role);
}

export function canCreateAppointmentFor(user: Principal, patientId: string): boolean {
  return user.id === patientId || CLINICAL_ROLES.has(user.role);
}
