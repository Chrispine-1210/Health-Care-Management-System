/**
 * API Validation & Health Check
 */

export const CRITICAL_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/me',
  '/api/products',
  '/api/orders',
  '/api/prescriptions',
  '/api/deliveries',
  '/api/branches',
];

export function validateApiEndpoints(registeredPaths: string[]): {
  missing: string[];
  present: string[];
} {
  const present = CRITICAL_ENDPOINTS.filter(ep => registeredPaths.includes(ep));
  const missing = CRITICAL_ENDPOINTS.filter(ep => !registeredPaths.includes(ep));
  
  return { present, missing };
}
