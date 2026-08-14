import type { Request, Response, NextFunction } from 'express';
import { authService } from './authSystem';
import { logger } from './logger';
import { hasPermission, type Permission } from '@shared/healthcareAccess';
import { getStorage } from './storageManager';

/**
 * Auth Middleware - Token validation and role checking
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
        branchId?: string | null;
      };
      authToken?: string;
    }
  }
}

/**
 * Extract and validate JWT from Authorization header
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn('Request without authentication token', { path: req.path });
    return res.status(401).json({ success: false, message: 'No authentication token provided' });
  }

  const user = authService.validateToken(token);
  if (!user) {
    logger.warn('Invalid or expired token', { path: req.path });
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  const storedUser = await getStorage().getUser(user.id);
  if (storedUser?.accountStatus && storedUser.accountStatus !== 'active') {
    authService.logout(user.id);
    logger.warn('Disabled or locked account rejected', { userId: user.id, path: req.path });
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    branchId: storedUser?.branchId,
  };
  req.authToken = token;

  next();
};

/**
 * Check if user has required role
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Unauthorized role access', { role: req.user.role, allowedRoles, path: req.path });
      return res.status(403).json({ success: false, message: `Insufficient permissions. Required: ${allowedRoles.join(', ')}` });
    }

    next();
  };
};

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!hasPermission(req.user.role, permission)) {
      logger.warn('Permission denied', { userId: req.user.id, permission, path: req.path });
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
};

/**
 * Optional authentication (user is optional, but validated if present)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const user = authService.validateToken(token);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }
  }

  next();
};
