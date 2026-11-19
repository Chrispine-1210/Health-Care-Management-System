import { hasPermission, normalizeHealthcareRole, PERMISSIONS, type Permission } from '@shared/healthcareAccess';

export type Principal = { id: string; role: string; branchId?: string | null };
export type PolicyContext = {
  ownerId?: string | null;
  patientId?: string | null;
  branchId?: string | null;
  assignedClinicianIds?: readonly string[];
  assignedDriverId?: string | null;
  emergencyAccess?: { active: boolean; expiresAt: Date; reason: string; elevatedAuth: boolean };
  recordStatus?: string | null;
};

function permitted(user: Principal, permission: Permission): boolean {
  return hasPermission(user.role, permission);
}

function sameBranch(user: Principal, context: PolicyContext): boolean {
  return Boolean(user.branchId && context.branchId && user.branchId === context.branchId);
}

function validEmergency(context: PolicyContext): boolean {
  const access = context.emergencyAccess;
  return Boolean(access?.active && access.elevatedAuth && access.reason.trim() && access.expiresAt > new Date());
}

function clinicallyAssigned(user: Principal, context: PolicyContext): boolean {
  return context.assignedClinicianIds?.includes(user.id) === true;
}

export function canReadPatientRecord(user: Principal, context: PolicyContext): boolean {
  if (!permitted(user, PERMISSIONS.PATIENT_PROFILE_READ)) return false;
  if (context.patientId === user.id) return true;
  return clinicallyAssigned(user, context) || validEmergency(context);
}

export function canUpdatePatientRecord(user: Principal, context: PolicyContext): boolean {
  return permitted(user, PERMISSIONS.PATIENT_PROFILE_UPDATE) && context.patientId === user.id;
}

export function canManageAppointment(user: Principal, context: PolicyContext): boolean {
  if (!permitted(user, PERMISSIONS.APPOINTMENT_MANAGE)) return false;
  return context.patientId === user.id || clinicallyAssigned(user, context) || sameBranch(user, context);
}

export function canWriteClinicalNote(user: Principal, context: PolicyContext): boolean {
  return permitted(user, PERMISSIONS.CLINICAL_NOTE_WRITE) && (clinicallyAssigned(user, context) || validEmergency(context));
}

export function canIssuePrescription(user: Principal, context: PolicyContext): boolean {
  return permitted(user, PERMISSIONS.PRESCRIPTION_ISSUE) && clinicallyAssigned(user, context);
}

export function canDispensePrescription(user: Principal, context: PolicyContext): boolean {
  return permitted(user, PERMISSIONS.PRESCRIPTION_DISPENSE) && sameBranch(user, context) && context.recordStatus === 'approved';
}

export function canManageLabRequest(user: Principal, context: PolicyContext): boolean {
  return permitted(user, PERMISSIONS.LAB_REQUEST_MANAGE) && clinicallyAssigned(user, context);
}

export function canPublishLabResult(user: Principal, context: PolicyContext): boolean {
  return permitted(user, PERMISSIONS.LAB_RESULT_PUBLISH) && sameBranch(user, context) && context.recordStatus !== 'published';
}

export function canManageOrder(user: Principal, context: PolicyContext): boolean {
  return permitted(user, PERMISSIONS.ORDER_MANAGE) && sameBranch(user, context);
}

export function canInitiatePayment(user: Principal, context: PolicyContext): boolean {
  return permitted(user, PERMISSIONS.PAYMENT_INITIATE) && context.ownerId === user.id && context.recordStatus === 'pending';
}

export function canManageDelivery(user: Principal, context: PolicyContext): boolean {
  return permitted(user, PERMISSIONS.DELIVERY_MANAGE) && context.assignedDriverId === user.id;
}

export function canReadOrder(user: Principal, order: { customerId: string; branchId?: string | null }): boolean {
  if (order.customerId === user.id) return true;
  if (normalizeHealthcareRole(user.role) === 'patient') return false;
  return permitted(user, PERMISSIONS.ORDER_READ) && sameBranch(user, order);
}

export function canUpdateOrder(user: Principal): boolean { return permitted(user, PERMISSIONS.ORDER_MANAGE); }
export function canReadPatientData(user: Principal, patientId: string): boolean { return canReadPatientRecord(user, { patientId }); }
export function canUpdateAppointment(user: Principal, appointment: { patientId: string; branchId?: string | null }): boolean { return canManageAppointment(user, appointment); }
export function canCreateAppointmentFor(user: Principal, patientId: string): boolean { return canManageAppointment(user, { patientId }); }
