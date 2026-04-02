/**
 * Rate Limiter - Per-endpoint & per-IP tracking
 */

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number }[];
}

const store: RateLimitStore = {};

export function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();

    if (!store[key]) {
      store[key] = [];
    }

    // Clean up old entries
    store[key] = store[key].filter(entry => entry.resetTime > now);

    if (store[key].length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((store[key][0].resetTime - now) / 1000),
      });
    }

    store[key].push({ count: 1, resetTime: now + windowMs });
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - store[key].length);

    next();
  };
}
