import type { RequestHandler } from 'express';
import { logger } from './logger';

// Rate limiting
interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

export function rateLimit(windowMs = 15 * 60 * 1000, maxRequests = 100): RequestHandler {
  return (req, res, next) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();

    if (!rateLimitStore[key]) {
      rateLimitStore[key] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    const record = rateLimitStore[key];
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
      return res.status(429).json({ message: 'Too many requests, please try again later' });
    }

    next();
  };
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/["'`]/g, '') // Remove quotes
    .trim();
}

// Password hashing (simple implementation without external package)
export async function hashPassword(password: string): Promise<string> {
  const { createHash, randomBytes } = await import('crypto');
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  const { createHash } = await import('crypto');
  const [salt, hash] = hashed.split(':');
  const newHash = createHash('sha256').update(password + salt).digest('hex');
  return newHash === hash;
}

// CORS and security headers
export const securityHeaders: RequestHandler = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};
