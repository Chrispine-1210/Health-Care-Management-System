import type { RequestHandler } from 'express';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { logger } from './logger';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};
const SENSITIVE_KEYS = new Set(['password', 'token', 'refreshToken', 'accessToken', 'authorization']);

export function rateLimit(windowMs = 15 * 60 * 1000, maxRequests = 100): RequestHandler {
  return (req, res, next) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();

    if (!rateLimitStore[key] || now > rateLimitStore[key].resetTime) {
      rateLimitStore[key] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    const record = rateLimitStore[key];
    record.count++;
    if (record.count > maxRequests) {
      logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
      return res.status(429).json({ message: 'Too many requests, please try again later' });
    }

    next();
  };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
}

export function sanitizePayload<T>(value: T): T {
  if (typeof value === 'string') return sanitizeInput(value) as T;
  if (Array.isArray(value)) return value.map((item) => sanitizePayload(item)) as T;
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, item]) => {
      acc[key] = SENSITIVE_KEYS.has(key) ? item : sanitizePayload(item);
      return acc;
    }, {}) as T;
  }
  return value;
}

export const sanitizeRequest: RequestHandler = (req, _res, next) => {
  req.body = sanitizePayload(req.body);
  req.query = sanitizePayload(req.query);
  req.params = sanitizePayload(req.params);
  next();
};

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  const [salt, hash] = hashed.split(':');
  const newHash = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  const expected = Buffer.from(hash, 'hex');
  const actual = Buffer.from(newHash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:");
  next();
};
