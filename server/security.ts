import type { RequestHandler } from 'express';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { logger } from './logger';

const SENSITIVE_KEYS = new Set(['password', 'token', 'refreshToken', 'accessToken', 'authorization']);

function parseAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export const corsHeaders: RequestHandler = (req, res, next) => {
  const requestOrigin = req.headers.origin?.replace(/\/$/, '');
  const allowedOrigins = parseAllowedOrigins();

  if (requestOrigin && (allowedOrigins.includes(requestOrigin) || allowedOrigins.includes('*'))) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
};

export function rateLimit(windowMs = 15 * 60 * 1000, maxRequests = 100): RequestHandler {
  if (!Number.isFinite(windowMs) || windowMs <= 0 || !Number.isInteger(maxRequests) || maxRequests < 1) throw new RangeError('Invalid rate limit');
  // Independent budgets per middleware instance; bounded memory. Multi-instance
  // deployments still require provider/distributed rate limits at the edge.
  const store = new Map<string, { count: number; resetTime: number }>();
  let calls = 0;
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    if (++calls % 64 === 0 || store.size >= 10_000) {
      for (const [id, record] of store) if (record.resetTime <= now) store.delete(id);
    }
    let record = store.get(key);
    if (!record || record.resetTime <= now) {
      if (store.size >= 10_000 && !record) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({ message: 'Request capacity reached; please retry later' });
      }
      record = { count: 0, resetTime: now + windowMs };
      store.set(key, record);
    }
    record.count++;
    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('RateLimit-Reset', Math.max(1, Math.ceil((record.resetTime - now) / 1000)));
    if (record.count > maxRequests) {
      res.setHeader('Retry-After', Math.max(1, Math.ceil((record.resetTime - now) / 1000)));
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

export const securityHeaders: RequestHandler = (req, res, next) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.vary('Authorization');
  }
  const scriptSource = process.env.NODE_ENV === 'development' ? "'self' 'unsafe-inline'" : "'self'";
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.setHeader('Content-Security-Policy', `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com data:; script-src ${scriptSource}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' https: wss:`);
  next();
};

export const correlationId: RequestHandler = (req, res, next) => {
  const supplied = req.headers['x-request-id'];
  const requestId = typeof supplied === 'string' && /^[A-Za-z0-9._-]{8,100}$/.test(supplied) ? supplied : randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};
