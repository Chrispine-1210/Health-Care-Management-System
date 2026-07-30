import type { RequestHandler } from 'express';
import { pool } from './db';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: Record<string, any>;
}

const startTime = Date.now();

export const healthCheck: RequestHandler = (_req, res) => {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    checks: {
      process: { status: 'ok' },
    },
  };

  res.json(health);
};

export const readinessCheck: RequestHandler = async (_req, res) => {
  const configured = Boolean(process.env.JWT_SECRET && process.env.PATIENT_DATA_ENCRYPTION_KEY && process.env.DATABASE_URL);
  if (!configured) return res.status(503).json({ ready: false, timestamp: new Date().toISOString() });
  try {
    if (process.env.USE_DATABASE_STORAGE === 'true') await pool.query('select 1');
    return res.json({ ready: true, timestamp: new Date().toISOString() });
  } catch {
    return res.status(503).json({ ready: false, timestamp: new Date().toISOString() });
  }
};
