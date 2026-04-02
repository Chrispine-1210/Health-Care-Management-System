import { getToken, setToken, removeToken } from './authUtils-standalone';

export { getToken, setToken, removeToken };

export async function loginUser(email: string, password: string) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!res.ok) throw new Error('Login failed');
  
  const { token } = await res.json();
  setToken(token);
  return token;
}

export async function logoutUser() {
  removeToken();
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch (e) {
    console.error('Logout error:', e);
  }
}
