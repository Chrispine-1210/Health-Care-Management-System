import type { RequestHandler } from 'express';
import { wilsonInterval } from '@shared/predictive';

/** A bounded, process-local observation window. No identities, paths or patient data. */
export class ReliabilityWindow {
  private events: Array<{ at: number; status: number; duration: number }> = [];
  constructor(private readonly capacity = 2000, private readonly windowMs = 15 * 60_000) {}
  record(status: number, duration: number, now = Date.now()) {
    if (!Number.isFinite(duration) || duration < 0) return;
    this.events = this.events.filter((e) => now - e.at < this.windowMs);
    this.events.push({ at: now, status, duration });
    if (this.events.length > this.capacity) this.events.shift();
  }
  snapshot(now = Date.now()) {
    const events = this.events.filter((e) => now - e.at < this.windowMs);
    const failures = events.filter((e) => e.status >= 500).length;
    const sorted = events.map((e) => e.duration).sort((a, b) => a - b);
    const interval = wilsonInterval(failures, events.length);
    return {
      scope: 'current_process_only', windowMs: this.windowMs, capacity: this.capacity,
      requests: events.length, serverErrors: failures,
      authorizationDenials: events.filter((e) => e.status === 401 || e.status === 403).length,
      rateLimited: events.filter((e) => e.status === 429).length,
      p95LatencyMs: events.length ? sorted[Math.ceil(events.length * 0.95) - 1] : null,
      serverErrorRate: interval,
      confidenceLevel: 0.95,
      assessment: events.length < 100 ? 'insufficient_evidence' : interval.lower > 0.01 ? 'investigate' : 'observe',
      assumptions: 'Wilson interval assumes independent, stationary request outcomes; correlated incidents can invalidate coverage.',
    };
  }
}

export const reliabilityWindow = new ReliabilityWindow();
export const observeApiReliability: RequestHandler = (req, res, next) => {
  if (req.path.startsWith('/api/') && req.path !== '/api/engineering/reliability') {
    const start = performance.now();
    res.once('finish', () => reliabilityWindow.record(res.statusCode, performance.now() - start));
  }
  next();
};
