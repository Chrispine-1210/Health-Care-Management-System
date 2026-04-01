export const USER_ROLES = {
  ADMIN: 'admin',
  PHARMACIST: 'pharmacist',
  STAFF: 'staff',
  CUSTOMER: 'customer',
  DRIVER: 'driver',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['read:all', 'write:all', 'delete:all', 'manage:users'],
  pharmacist: ['read:prescriptions', 'write:prescriptions', 'read:inventory'],
  staff: ['read:orders', 'write:orders', 'read:inventory'],
  customer: ['read:own', 'write:own', 'read:shop'],
  driver: ['read:deliveries', 'write:deliveries', 'read:own'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  pharmacist: 'Pharmacist',
  staff: 'Staff Member',
  customer: 'Customer',
  driver: 'Delivery Driver',
};
