import type { RequestHandler } from 'express';
import { pool } from './db';
import { productionConfigurationIssues } from './config';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: Record<string, any>;
}

const startTime = Date.now();

export const healthCheck: RequestHandler = (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
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
  res.setHeader('Cache-Control', 'no-store');
  if (productionConfigurationIssues().length) return res.status(503).json({ ready: false, timestamp: new Date().toISOString() });
  try {
    await pool.query('select 1');
    return res.json({ ready: true, timestamp: new Date().toISOString() });
  } catch {
    return res.status(503).json({ ready: false, timestamp: new Date().toISOString() });
  }
};
