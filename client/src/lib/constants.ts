// UI Constants
export const DELIVERY_BASE_FEE = 500; // MK
export const DELIVERY_PER_KM = 50; // MK per km

// Roles
export const ROLES = {
  ADMIN: 'admin',
  PHARMACIST: 'pharmacist',
  STAFF: 'staff',
  CUSTOMER: 'customer',
  DRIVER: 'driver',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  READY: 'ready',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Prescription Status
export const PRESCRIPTION_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DISPENSED: 'dispensed',
} as const;

// Payment Methods
export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash Payment', icon: 'DollarSign' },
  { id: 'airtel_money', name: 'Airtel Money', icon: 'Phone' },
  { id: 'tnm_mpamba', name: 'TNM Mpamba', icon: 'Phone' },
  { id: 'card', name: 'Card Payment', icon: 'CreditCard' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: 'Building' },
] as const;

// Colors
export const THEME_COLORS = {
  PRIMARY: 'hsl(142 71% 45%)', // Medical green
  SECONDARY: 'hsl(0 0% 94%)', // Light gray
  DESTRUCTIVE: 'hsl(0 84% 60%)', // Red
  SUCCESS: 'hsl(142 71% 45%)',
  WARNING: 'hsl(38 92% 50%)',
  INFO: 'hsl(217 91% 60%)',
} as const;
