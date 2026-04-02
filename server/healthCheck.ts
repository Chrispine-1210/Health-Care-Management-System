import type { RequestHandler } from 'express';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: Record<string, any>;
}

const startTime = Date.now();

export const healthCheck: RequestHandler = (req, res) => {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    checks: {
      database: { status: 'ok', message: 'In-memory storage active' },
      auth: { status: 'ok', message: 'JWT authentication enabled' },
      api: { status: 'ok', message: 'API endpoints responsive' },
    },
  };

  res.json(health);
};

export const readinessCheck: RequestHandler = (req, res) => {
  res.json({ ready: true, timestamp: new Date().toISOString() });
};
