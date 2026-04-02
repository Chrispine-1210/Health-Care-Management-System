import type { RequestHandler } from 'express';

export const cacheMiddleware = (maxAge = 3600): RequestHandler => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${maxAge}`);
    } else {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    next();
  };
};

export const compressionHeaders: RequestHandler = (req, res, next) => {
  res.setHeader('Content-Encoding', 'gzip');
  res.setHeader('Vary', 'Accept-Encoding');
  next();
};

export const responseOptimization: RequestHandler = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data: any) {
    // Only wrap successful responses (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const response = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
      return originalJson.call(this, response);
    }
    // For errors, return as-is without wrapping
    return originalJson.call(this, data);
  };
  next();
};
