import type { Express } from 'express';
import { authService } from './authSystem';
import { authenticateToken, requireRole } from './authMiddleware';
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
  password: z.string().min(6),
  role: z.enum(['admin', 'pharmacist', 'staff', 'customer', 'driver']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
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
   * Register new user
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
  app.get('/api/auth/sessions', authenticateToken, requireRole('admin'), (req, res) => {
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
