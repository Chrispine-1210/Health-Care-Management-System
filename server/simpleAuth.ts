import { createHmac, randomBytes } from 'crypto';
import type { Express, RequestHandler } from 'express';
import { getStorage } from './storageManager';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production-12345678';

// Simple JWT without external library
function createToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const signature = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, body, sig] = parts;
    const signature = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    
    if (signature !== sig) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    return null;
  }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  (req as any).user = { claims: payload };
  next();
};

export function requireRole(roles: string[]): RequestHandler {
  return (req, res, next) => {
    const userRole = (req as any).user?.claims?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

const demoUsers: Record<string, any> = {
  'admin@thandizo.com': { role: 'admin', firstName: 'Admin', lastName: 'User' },
  'pharmacist@thandizo.com': { role: 'pharmacist', firstName: 'Pharmacist', lastName: 'User' },
  'staff@thandizo.com': { role: 'staff', firstName: 'Staff', lastName: 'User' },
  'customer@thandizo.com': { role: 'customer', firstName: 'Customer', lastName: 'User' },
  'driver@thandizo.com': { role: 'driver', firstName: 'Driver', lastName: 'User' },
};

const users: Record<string, any> = { ...demoUsers };

export async function setupSimpleAuth(app: Express) {
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      const user = users[email] || demoUsers[email];
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = createToken({ userId: email, email, role: user.role });
      res.json({ 
        token, 
        user: { id: email, email, role: user.role, firstName: user.firstName, lastName: user.lastName } 
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      if (!email || !password || !firstName) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (users[email] || demoUsers[email]) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const newUser = { 
        role: role || 'customer', 
        firstName, 
        lastName: lastName || '',
        passwordHash: password // In production, hash this properly
      };
      
      users[email] = newUser;

      const token = createToken({ userId: email, email, role: newUser.role });
      res.json({ 
        token, 
        user: { id: email, email, role: newUser.role, firstName, lastName: newUser.lastName } 
      });
    } catch (error) {
      res.status(500).json({ message: 'Signup failed' });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const claims = (req as any).user.claims;
      const email = claims.email;
      const user = users[email] || demoUsers[email] || { role: claims.role };
      res.json({ 
        id: email, 
        email, 
        role: user.role, 
        firstName: user.firstName || 'User', 
        lastName: user.lastName || '' 
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.post('/api/logout', (req, res) => {
    res.json({ message: 'Logged out' });
  });
}
