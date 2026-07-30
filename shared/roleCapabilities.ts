export const PLATFORM_ROLES = ['customer', 'driver', 'pharmacist', 'staff', 'admin'] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

const DEFAULT_ROUTES: Record<PlatformRole, string> = {
  customer: '/customer',
  driver: '/driver',
  pharmacist: '/pharmacist',
  staff: '/staff',
  admin: '/admin',
};

export function getDefaultRouteForRole(role?: string | null): string {
  return role && role in DEFAULT_ROUTES ? DEFAULT_ROUTES[role as PlatformRole] : '/';
}
