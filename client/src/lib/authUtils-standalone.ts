import { clearAuthenticatedSession, storeAuthenticatedSession } from "@/lib/authSession";

const TOKEN_KEY = 'auth_token';

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded));
    return payload.exp ? Date.now() >= payload.exp * 1000 : false;
  } catch {
    return true;
  }
}

export async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!res.ok) throw new Error('Login failed');
  
  const result = await res.json();
  storeAuthenticatedSession({
    token: result.data.token,
    refreshToken: result.data.refreshToken,
    user: result.data.user,
  });
  return result.data.user;
}

export async function signup(email: string, password: string, firstName: string, lastName: string, role: string) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName, lastName, role }),
  });
  
  if (!res.ok) throw new Error('Signup failed');

  return login(email, password);
}

export function logout() {
  clearAuthenticatedSession();
  window.location.href = '/';
}
