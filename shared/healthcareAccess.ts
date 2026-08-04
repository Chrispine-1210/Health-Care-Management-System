export const HEALTHCARE_ROLES = [
  'patient', 'doctor', 'nurse', 'pharmacist', 'receptionist',
  'laboratory_staff', 'delivery_driver', 'branch_administrator',
  'system_administrator', 'super_administrator',
] as const;

export type HealthcareRole = (typeof HEALTHCARE_ROLES)[number];

export const PERMISSIONS = {
  PATIENT_PROFILE_READ: 'patient.profile.read',
  PATIENT_PROFILE_UPDATE: 'patient.profile.update',
  APPOINTMENT_READ: 'appointment.read',
  APPOINTMENT_MANAGE: 'appointment.manage',
  CLINICAL_NOTE_READ: 'clinical_note.read',
  CLINICAL_NOTE_WRITE: 'clinical_note.write',
  DIAGNOSIS_WRITE: 'diagnosis.write',
  PRESCRIPTION_READ: 'prescription.read',
  PRESCRIPTION_ISSUE: 'prescription.issue',
  PRESCRIPTION_DISPENSE: 'prescription.dispense',
  PRESCRIPTION_REVIEW: 'prescriptions.review',
  PRESCRIPTION_APPROVE: 'prescriptions.approve',
  PRESCRIPTION_REJECT: 'prescriptions.reject',
  PRESCRIPTION_REVOKE: 'prescriptions.revoke',
  DISPENSING_START: 'dispensing.start',
  DISPENSING_COMPLETE: 'dispensing.complete',
  DISPENSING_REVERSE: 'dispensing.reverse',
  CONTROLLED_MEDICINE_DISPENSE: 'controlled_medicines.dispense',
  INVENTORY_BATCH_SUBSTITUTE: 'inventory.batch_substitute',
  LAB_REQUEST_MANAGE: 'laboratory.request.manage',
  LAB_RESULT_READ: 'laboratory.result.read',
  LAB_RESULT_PUBLISH: 'laboratory.result.publish',
  ORDER_READ: 'order.read',
  ORDER_MANAGE: 'order.manage',
  ORDER_CANCEL: 'orders.cancel',
  ORDER_CANCEL_AFTER_PAYMENT: 'orders.cancel_after_payment',
  RESERVATION_RELEASE: 'reservations.release',
  INVENTORY_READ: 'inventory.read',
  INVENTORY_MANAGE: 'inventory.manage',
  PRODUCT_MANAGE: 'product.manage',
  CONTENT_MANAGE: 'content.manage',
  PAYMENT_READ: 'payment.read',
  PAYMENT_INITIATE: 'payment.initiate',
  PAYMENT_SETTLE: 'payment.settle',
  DELIVERY_READ: 'delivery.read',
  DELIVERY_MANAGE: 'delivery.manage',
  STAFF_MANAGE_BRANCH: 'staff.manage.branch',
  STAFF_MANAGE_SYSTEM: 'staff.manage.system',
  BRANCH_MANAGE: 'branch.manage',
  NOTIFICATION_SEND: 'notification.send',
  REPORT_VIEW: 'report.view',
  DATA_EXPORT: 'data.export',
  AUDIT_LOG_VIEW: 'audit_log.view',
  SYSTEM_CONFIGURE: 'system.configure',
  EMERGENCY_ACCESS_REQUEST: 'emergency_access.request',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const p = PERMISSIONS;
export const ROLE_PERMISSIONS: Record<HealthcareRole, ReadonlySet<Permission>> = {
  patient: new Set([p.PATIENT_PROFILE_READ, p.PATIENT_PROFILE_UPDATE, p.APPOINTMENT_READ, p.APPOINTMENT_MANAGE, p.PRESCRIPTION_READ, p.ORDER_READ, p.ORDER_CANCEL, p.PAYMENT_READ, p.PAYMENT_INITIATE]),
  doctor: new Set([p.PATIENT_PROFILE_READ, p.APPOINTMENT_READ, p.APPOINTMENT_MANAGE, p.CLINICAL_NOTE_READ, p.CLINICAL_NOTE_WRITE, p.DIAGNOSIS_WRITE, p.PRESCRIPTION_READ, p.PRESCRIPTION_ISSUE, p.LAB_REQUEST_MANAGE, p.LAB_RESULT_READ, p.EMERGENCY_ACCESS_REQUEST]),
  nurse: new Set([p.PATIENT_PROFILE_READ, p.APPOINTMENT_READ, p.CLINICAL_NOTE_READ, p.CLINICAL_NOTE_WRITE, p.LAB_REQUEST_MANAGE, p.LAB_RESULT_READ, p.EMERGENCY_ACCESS_REQUEST]),
  pharmacist: new Set([p.PATIENT_PROFILE_READ, p.PRESCRIPTION_READ, p.PRESCRIPTION_DISPENSE, p.PRESCRIPTION_REVIEW, p.PRESCRIPTION_APPROVE, p.PRESCRIPTION_REJECT, p.PRESCRIPTION_REVOKE, p.DISPENSING_START, p.DISPENSING_COMPLETE, p.DISPENSING_REVERSE, p.CONTROLLED_MEDICINE_DISPENSE, p.INVENTORY_BATCH_SUBSTITUTE, p.ORDER_READ, p.ORDER_MANAGE, p.ORDER_CANCEL, p.ORDER_CANCEL_AFTER_PAYMENT, p.RESERVATION_RELEASE, p.INVENTORY_READ, p.INVENTORY_MANAGE, p.EMERGENCY_ACCESS_REQUEST]),
  receptionist: new Set([p.PATIENT_PROFILE_READ, p.APPOINTMENT_READ, p.APPOINTMENT_MANAGE, p.ORDER_READ, p.ORDER_MANAGE, p.ORDER_CANCEL, p.RESERVATION_RELEASE, p.INVENTORY_READ, p.NOTIFICATION_SEND]),
  laboratory_staff: new Set([p.PATIENT_PROFILE_READ, p.LAB_REQUEST_MANAGE, p.LAB_RESULT_READ, p.LAB_RESULT_PUBLISH]),
  delivery_driver: new Set([p.DELIVERY_READ, p.DELIVERY_MANAGE]),
  branch_administrator: new Set([p.ORDER_READ, p.ORDER_MANAGE, p.ORDER_CANCEL, p.ORDER_CANCEL_AFTER_PAYMENT, p.RESERVATION_RELEASE, p.INVENTORY_READ, p.INVENTORY_MANAGE, p.PRODUCT_MANAGE, p.DELIVERY_READ, p.STAFF_MANAGE_BRANCH, p.BRANCH_MANAGE, p.CONTENT_MANAGE, p.NOTIFICATION_SEND, p.REPORT_VIEW, p.AUDIT_LOG_VIEW]),
  system_administrator: new Set([p.STAFF_MANAGE_SYSTEM, p.BRANCH_MANAGE, p.PRODUCT_MANAGE, p.CONTENT_MANAGE, p.NOTIFICATION_SEND, p.REPORT_VIEW, p.AUDIT_LOG_VIEW, p.SYSTEM_CONFIGURE]),
  super_administrator: new Set([p.STAFF_MANAGE_SYSTEM, p.BRANCH_MANAGE, p.PRODUCT_MANAGE, p.CONTENT_MANAGE, p.NOTIFICATION_SEND, p.REPORT_VIEW, p.DATA_EXPORT, p.AUDIT_LOG_VIEW, p.SYSTEM_CONFIGURE]),
};

const LEGACY_ROLE_MAP: Record<string, HealthcareRole> = {
  customer: 'patient', driver: 'delivery_driver', staff: 'receptionist', admin: 'system_administrator',
};

export function normalizeHealthcareRole(role: string): HealthcareRole | null {
  const normalized = LEGACY_ROLE_MAP[role] ?? role;
  return HEALTHCARE_ROLES.includes(normalized as HealthcareRole) ? normalized as HealthcareRole : null;
}

export function hasPermission(role: string, permission: Permission): boolean {
  const normalized = normalizeHealthcareRole(role);
  return normalized ? ROLE_PERMISSIONS[normalized].has(permission) : false;
}

export function canRoleAssign(actorRole: string, targetRole: string): boolean {
  const actor = normalizeHealthcareRole(actorRole);
  const target = normalizeHealthcareRole(targetRole);
  if (!actor || !target) return false;
  if (actor === 'super_administrator') return target !== 'super_administrator';
  if (actor === 'system_administrator') return !['system_administrator', 'super_administrator'].includes(target);
  if (actor === 'branch_administrator') return ['receptionist', 'laboratory_staff', 'delivery_driver'].includes(target);
  return false;
}
