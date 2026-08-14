import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { logger } from './logger';
import { z } from 'zod';
import { db } from './db';
import { authCredentials, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { normalizeHealthcareRole } from '@shared/healthcareAccess';

/**
 * Production-Ready Authentication System
 * Features: JWT + Refresh tokens, Password hashing, Session management, Rate limiting
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  iat: number;
  exp: number;
}

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
}

// ============================================================================
// PASSWORD HASHING CLASS
// ============================================================================

class PasswordManager {
  private keyLength = 64;

  /**
   * Hash password with salt
   */
  hash(password: string, salt?: string): string {
    const passwordSalt = salt || randomBytes(32).toString('hex');
    const hash = scryptSync(password, passwordSalt, this.keyLength).toString('hex');
    return `scrypt:${passwordSalt}:${hash}`;
  }

  /**
   * Verify password
   */
  verify(password: string, hashedPassword: string): boolean {
    const [algorithm, salt, hash] = hashedPassword.split(':');
    if (algorithm !== 'scrypt' || !salt || !hash) return false;
    const newHash = scryptSync(password, salt, this.keyLength).toString('hex');
    const expected = Buffer.from(hash, 'hex');
    const actual = Buffer.from(newHash, 'hex');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}

// ============================================================================
// JWT TOKEN MANAGER CLASS
// ============================================================================

class TokenManager {
  private secret: string;
  private accessTokenExpiry = 15 * 60; // 15 minutes
  private refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 days

  constructor(secret?: string) {
    this.secret = secret || process.env.JWT_SECRET || '';
    if (!this.secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production');
      }
      this.secret = randomBytes(32).toString('hex');
      logger.warn('Ephemeral development JWT secret generated; set JWT_SECRET for persistent sessions');
    }
  }

  /**
   * Create JWT token (simple implementation without external library)
   */
  private createToken(payload: Record<string, any>, expiresIn: number): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    const signature = createHmac('sha256', this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): Record<string, any> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const signature = createHmac('sha256', this.secret)
        .update(`${parts[0]}.${parts[1]}`)
        .digest('base64url');

      const expected = Buffer.from(signature);
      const actual = Buffer.from(parts[2]);
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp < now) return null;

      return payload;
    } catch (error) {
      logger.error('Token verification failed', { error });
      return null;
    }
  }

  /**
   * Generate access token
   */
  createAccessToken(userId: string, email: string, role: string, firstName: string, lastName: string): string {
    return this.createToken(
      { sub: userId, email, role, firstName, lastName, type: 'access' },
      this.accessTokenExpiry,
    );
  }

  /**
   * Generate refresh token
   */
  createRefreshToken(userId: string): string {
    return this.createToken({ sub: userId, type: 'refresh', tokenId: randomBytes(8).toString('hex') }, this.refreshTokenExpiry);
  }

  /**
   * Get token expiration timestamp
   */
  getTokenExpiry(expiresIn: number): number {
    return Math.floor(Date.now() / 1000) + expiresIn;
  }
}

// ============================================================================
// SESSION MANAGER CLASS
// ============================================================================

class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private refreshTokens: Map<string, string> = new Map(); // refreshToken -> userId
  private idleTimeoutMs = Number(process.env.SESSION_IDLE_TIMEOUT_MS || 30 * 60 * 1000);
  private blacklistedTokens: Set<string> = new Set();

  /**
   * Create session
   */
  createSession(
    userId: string,
    email: string,
    role: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): SessionData {
    const now = Date.now();
    const session: SessionData = {
      userId,
      email,
      role,
      accessToken,
      refreshToken,
      createdAt: now,
      expiresAt: now + expiresIn * 1000,
      lastActivity: now,
    };

    this.sessions.set(userId, session);
    this.refreshTokens.set(refreshToken, userId);
    logger.info('Session created', { userId, email });

    return session;
  }

  /**
   * Get session
   */
  getSession(userId: string): SessionData | null {
    return this.sessions.get(userId) || null;
  }

  /**
   * Validate session is active
   */
  isSessionActive(userId: string): boolean {
    const session = this.sessions.get(userId);
    if (!session) return false;

    const now = Date.now();
    if (session.expiresAt < now || now - session.lastActivity > this.idleTimeoutMs) {
      this.blacklistedTokens.add(session.accessToken);
      this.blacklistedTokens.add(session.refreshToken);
      this.refreshTokens.delete(session.refreshToken);
      this.sessions.delete(userId);
      return false;
    }

    // Update last activity
    session.lastActivity = now;
    return true;
  }

  /**
   * Revoke session (logout)
   */
  revokeSession(userId: string): void {
    const session = this.sessions.get(userId);
    if (session) {
      this.blacklistedTokens.add(session.accessToken);
      this.blacklistedTokens.add(session.refreshToken);
      this.refreshTokens.delete(session.refreshToken);
      this.sessions.delete(userId);
      logger.info('Session revoked', { userId });
    }
  }

  /**
   * Check if token is blacklisted
   */
  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Cleanup expired sessions (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, session] of this.sessions) {
      if (session.expiresAt < now) {
        this.sessions.delete(userId);
        this.refreshTokens.delete(session.refreshToken);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Session cleanup completed', { cleaned });
    }
  }
}

// ============================================================================
// AUTH SERVICE CLASS (Main API)
// ============================================================================

export class AuthService {
  private passwordManager: PasswordManager;
  private tokenManager: TokenManager;
  private sessionManager: SessionManager;

  // User credentials store (in-memory for demo, replace with database)
  private users: Map<string, { email: string; passwordHash: string; role: string; firstName: string; lastName: string }> = new Map();
  private readonly databaseBacked = process.env.USE_DATABASE_STORAGE === 'true';

  constructor() {
    this.passwordManager = new PasswordManager();
    this.tokenManager = new TokenManager();
    this.sessionManager = new SessionManager();

    // Cleanup expired sessions every hour
    setInterval(() => this.sessionManager.cleanup(), 60 * 60 * 1000).unref();
  }

  /**
   * Login - Authenticate user and return tokens
   */
  async login(email: string, password: string): Promise<{ tokens: AuthTokens; user: Omit<AuthUser, 'iat' | 'exp'> } | null> {
    // Validate input
    if (!email || !password) {
      logger.warn('Login attempt with missing credentials', { email });
      return null;
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = this.users.get(normalizedEmail);
    let userId = `user-${normalizedEmail}`;
    if (this.databaseBacked) {
      const [record] = await db.select({
        userId: authCredentials.userId, email: authCredentials.email, passwordHash: authCredentials.passwordHash,
        role: users.role, firstName: users.firstName, lastName: users.lastName, accountStatus: users.accountStatus,
      }).from(authCredentials).innerJoin(users, eq(users.id, authCredentials.userId)).where(eq(authCredentials.email, normalizedEmail)).limit(1);
      if (record?.accountStatus !== 'active') return null;
      user = record ? { email: record.email, passwordHash: record.passwordHash, role: record.role, firstName: record.firstName ?? '', lastName: record.lastName ?? '' } : undefined;
      if (record) userId = record.userId;
    }
    if (!user) {
      logger.warn('Login attempt with non-existent user', { email: normalizedEmail });
      return null;
    }

    // Verify password
    if (!this.passwordManager.verify(password, user.passwordHash)) {
      logger.warn('Login attempt with incorrect password', { email });
      return null;
    }

    // Generate tokens
    const accessToken = this.tokenManager.createAccessToken(userId, normalizedEmail, user.role, user.firstName, user.lastName);
    const refreshToken = this.tokenManager.createRefreshToken(userId);

    // Create session
    this.sessionManager.createSession(userId, normalizedEmail, user.role, accessToken, refreshToken, 15 * 60);

    logger.info('User logged in successfully', { email: normalizedEmail, role: user.role });

    return {
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60,
      },
      user: {
        id: userId,
        email: normalizedEmail,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number } | null> {
    const payload = this.tokenManager.verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      logger.warn('Invalid refresh token');
      return null;
    }

    if (this.sessionManager.isTokenBlacklisted(refreshToken)) {
      logger.warn('Attempt to refresh with blacklisted token');
      return null;
    }

    const session = this.sessionManager.getSession(payload.sub);
    if (!this.databaseBacked && (!session || session.refreshToken !== refreshToken || !this.sessionManager.isSessionActive(payload.sub))) {
      logger.warn('Refresh token session not found', { userId: payload.sub });
      return null;
    }
    let user = session ? Array.from(this.users.values()).find(u => u.email === session.email) : undefined;
    if (this.databaseBacked) {
      const [record] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
      if (record?.accountStatus !== 'active') return null;
      user = record ? { email: record.email ?? '', passwordHash: '', role: record.role, firstName: record.firstName ?? '', lastName: record.lastName ?? '' } : undefined;
    }
    if (!user) {
      logger.warn('User not found for refresh', { userId: payload.sub });
      return null;
    }

    // Create new access token
    const newAccessToken = this.tokenManager.createAccessToken(
      payload.sub,
      user.email,
      user.role,
      user.firstName,
      user.lastName,
    );

    logger.info('Access token refreshed', { userId: payload.sub });

    return {
      accessToken: newAccessToken,
      expiresIn: 15 * 60,
    };
  }

  /**
   * Validate access token
   */
  validateToken(token: string): AuthUser | null {
    if (this.sessionManager.isTokenBlacklisted(token)) {
      logger.warn('Attempt to use blacklisted token');
      return null;
    }

    const payload = this.tokenManager.verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return null;
    }

    if (!this.databaseBacked && !this.sessionManager.isSessionActive(payload.sub)) {
      logger.warn('Inactive or expired session token rejected', { userId: payload.sub });
      return null;
    }

    if (typeof payload.sub !== 'string') return null;
    return { ...payload, id: payload.sub } as AuthUser;
  }

  /**
   * Logout - Revoke session
   */
  logout(userId: string): void {
    this.sessionManager.revokeSession(userId);
    logger.info('User logged out', { userId });
  }

  /**
   * Register new user (if needed)
   */
  async register(
    email: string,
    password: string,
    role: string,
    firstName: string,
    lastName: string,
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    if (this.users.has(normalizedEmail)) {
      return { success: false, message: 'User already exists' };
    }

    const passwordHash = this.passwordManager.hash(password);
    const canonicalRole = normalizeHealthcareRole(role) ?? 'patient';
    if (this.databaseBacked) {
      const existing = await db.select({ id: authCredentials.id }).from(authCredentials).where(eq(authCredentials.email, normalizedEmail)).limit(1);
      if (existing.length) return { success: false, message: 'User already exists' };
      const userId = randomUUID();
      await db.transaction(async (tx) => {
        await tx.insert(users).values({ id: userId, email: normalizedEmail, firstName, lastName, role: canonicalRole });
        await tx.insert(authCredentials).values({ userId, email: normalizedEmail, passwordHash });
      });
    }
    this.users.set(normalizedEmail, {
      email: normalizedEmail,
      passwordHash,
      role: canonicalRole,
      firstName,
      lastName,
    });

    logger.info('New user registered', { email: normalizedEmail, role: canonicalRole });
    return { success: true, message: 'User registered successfully' };
  }

  async confirmPassword(email: string, password: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    if (this.databaseBacked) {
      const [credential] = await db.select({ passwordHash: authCredentials.passwordHash }).from(authCredentials).where(eq(authCredentials.email, normalizedEmail)).limit(1);
      return Boolean(credential && this.passwordManager.verify(password, credential.passwordHash));
    }
    const user = this.users.get(normalizedEmail);
    return Boolean(user && this.passwordManager.verify(password, user.passwordHash));
  }

  /**
   * Get all sessions (admin only)
   */
  getAllSessions(): Array<{ userId: string; email: string; role: string; lastActivity: number }> {
    return Array.from(this.sessionManager['sessions'].values()).map(session => ({
      userId: session.userId,
      email: session.email,
      role: session.role,
      lastActivity: session.lastActivity,
    }));
  }
}

// Export singleton instance
export const authService = new AuthService();
