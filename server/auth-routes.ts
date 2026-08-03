import type { Express } from 'express';
import { authService } from './authSystem';
import { authenticateToken, requirePermission } from './authMiddleware';
import { PERMISSIONS } from '@shared/healthcareAccess';
import { logger } from './logger';
import { z } from 'zod';

/**
 * Authentication Routes - Login, refresh, logout, etc.
 */

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  role: z.enum(['customer', 'driver']).default('customer'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const adminRegisterSchema = registerSchema.extend({
  role: z.enum(['admin', 'pharmacist', 'staff', 'customer', 'driver']),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export function registerAuthRoutes(app: Express) {
  /**
   * POST /api/auth/login
   * Login with email and password, return tokens
   */
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const result = await authService.login(email, password);
      if (!result) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      res.json({
        success: true,
        data: {
          token: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: result.tokens.expiresIn,
          user: result.user,
        },
      });
    } catch (error) {
      logger.error('Login error', { error });
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  /**
   * POST /api/auth/register
   * Public self-registration is restricted to non-privileged roles.
   */
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, role, firstName, lastName } = registerSchema.parse(req.body);

      const result = await authService.register(email, password, role, firstName, lastName);
      if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
      }

      res.json({ success: true, message: result.message });
    } catch (error) {
      logger.error('Registration error', { error });
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  /**
   * POST /api/auth/admin/users
   * Admin-only creation of privileged staff accounts.
   */
  app.post('/api/auth/admin/users', authenticateToken, requirePermission(PERMISSIONS.STAFF_MANAGE_SYSTEM), async (req, res) => {
    try {
      const { email, password, role, firstName, lastName } = adminRegisterSchema.parse(req.body);
      const result = await authService.register(email, password, role, firstName, lastName);
      if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
      }
      res.json({ success: true, message: result.message });
    } catch (error) {
      logger.error('Admin registration error', { error });
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  app.post('/api/auth/refresh', (req, res) => {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);

      const result = authService.refreshAccessToken(refreshToken);
      if (!result) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token' });
      }

      res.json({
        success: true,
        data: {
          token: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      logger.error('Token refresh error', { error });
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout current user
   */
  app.post('/api/auth/logout', authenticateToken, (req, res) => {
    try {
      if (req.user) {
        authService.logout(req.user.id);
      }

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error', { error });
      res.status(500).json({ success: false, message: 'Logout failed' });
    }
  });

  // Compatibility endpoint retained for existing clients while enforcing the
  // same authenticated server-side session revocation as the canonical route.
  app.post('/api/logout', authenticateToken, (req, res) => {
    try {
      authService.logout(req.user!.id);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error', { error });
      res.status(500).json({ success: false, message: 'Logout failed' });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user info
   */
  app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({
      success: true,
      data: {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        firstName: req.user!.firstName,
        lastName: req.user!.lastName,
      },
    });
  });

  /**
   * GET /api/auth/sessions (Admin only)
   * List all active sessions
   */
  app.get('/api/auth/sessions', authenticateToken, requirePermission(PERMISSIONS.AUDIT_LOG_VIEW), (req, res) => {
    const sessions = authService.getAllSessions();
    res.json({
      success: true,
      data: {
        total: sessions.length,
        sessions,
      },
    });
  });

  logger.info('Auth routes registered');
}
