export const PLATFORM_ROLES = ['customer', 'driver', 'pharmacist', 'staff', 'admin'] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

const DEFAULT_ROUTES: Record<PlatformRole, string> = {
  customer: '/',
  driver: '/driver',
  pharmacist: '/pharmacist',
  staff: '/staff',
  admin: '/admin',
};

export function getDefaultRouteForRole(role?: string | null): string {
  const normalized: Record<string, PlatformRole> = {
    patient: 'customer', delivery_driver: 'driver', receptionist: 'staff',
    branch_administrator: 'admin', system_administrator: 'admin', super_administrator: 'admin',
  };
  const platformRole = role ? normalized[role] ?? role : undefined;
  return platformRole && platformRole in DEFAULT_ROUTES ? DEFAULT_ROUTES[platformRole as PlatformRole] : '/';
}
