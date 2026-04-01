import { getToken, setToken, removeToken } from './authUtils-standalone';
import { clearAuthenticatedSession, storeAuthenticatedSession } from "@/lib/authSession";

export { getToken, setToken, removeToken };

export async function loginUser(email: string, password: string) {
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
  return result.data.token;
}

export async function logoutUser() {
  const token = getToken();
  try {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    await fetch('/api/logout', { method: 'POST' });
  } catch (e) {
    console.error('Logout error:', e);
  }
  clearAuthenticatedSession();
}
