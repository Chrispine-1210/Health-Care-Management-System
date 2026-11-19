import type { Express } from 'express';
import { z } from 'zod';
import { forecastDemand } from '@shared/predictive';
import { PERMISSIONS, normalizeHealthcareRole } from '@shared/healthcareAccess';
import { authenticateToken, requirePermission } from './authMiddleware';
import { getStorage } from './storageManager';
import { asyncHandler } from './errorHandler';
import { reliabilityWindow } from './reliability';
import { rateLimit } from './security';
import { buildDemandSeries, completeDayBoundary } from './demandSeries';

const querySchema = z.object({
  productId: z.string().min(1).max(255), branchId: z.string().min(1).max(255),
  lookbackDays: z.coerce.number().int().min(14).max(180).default(56),
  leadTimeDays: z.coerce.number().int().min(1).max(90).default(7),
}).strict();
const scenarioSchema = z.object({
  dailyCounts: z.array(z.number().int().min(0).max(100_000)).min(14).max(365),
  availableStock: z.number().int().min(0).max(100_000_000), leadTimeDays: z.number().int().min(1).max(90),
  serviceLevel: z.number().min(0.8).max(0.999).optional(),
}).strict();

export function registerIntelligenceApi(app: Express) {
  app.get('/api/inventory/forecast', authenticateToken, requirePermission(PERMISSIONS.INVENTORY_READ), rateLimit(60_000, 20), asyncHandler(async (req: any, res: any) => {
    const query = querySchema.safeParse(req.query);
    if (!query.success) return res.status(400).json({ message: 'Invalid forecast parameters' });
    const { productId, branchId, lookbackDays, leadTimeDays } = query.data;
    const global = ['system_administrator', 'super_administrator'].includes(normalizeHealthcareRole(req.user.role) ?? '');
    if (!global && (!req.user.branchId || req.user.branchId !== branchId)) return res.status(403).json({ message: 'Assigned branch required' });
    const storage = getStorage();
    const [product, branch] = await Promise.all([storage.getProduct(productId), storage.getBranch(branchId)]);
    if (!product || !branch || !branch.isActive) return res.status(404).json({ message: 'Product or active branch not found' });
    const now = Date.now();
    const until = new Date(completeDayBoundary(now));
    const since = new Date(until.getTime() - lookbackDays * 86_400_000);
    const [movements, batches] = await Promise.all([
      storage.getStockMovements({ productId, branchId, since, until, limit: 20_001 }),
      storage.getStockBatchesByProduct(productId),
    ]);
    if (movements.length > 20_000) return res.status(422).json({ message: 'Too many movements for interactive forecasting; reduce the observation window' });
    const series = buildDemandSeries(movements, batches.filter((b) => b.branchId === branchId), lookbackDays, now);
    const counts = series.dailyCounts.slice(-series.observedDays || series.dailyCounts.length);
    const forecast = series.observedDays >= 14 ? forecastDemand({ dailyCounts: counts, availableStock: series.availableStock, leadTimeDays }) : null;
    return res.json({ productId, branchId, source: 'recorded_dispensing_ledger', generatedAt: new Date(now).toISOString(),
      series, forecast: forecast ? { ...forecast, support: 'review_required', suggestedReorder: null,
        reasons: [...forecast.reasons, 'Ledger completeness, historical stockouts and unmet demand have not been verified.'] } : null,
      status: forecast ? 'coverage_review_required' : 'insufficient_evidence', automationAllowed: false });
  }));

  app.post('/api/inventory/forecast-scenario', authenticateToken, requirePermission(PERMISSIONS.INVENTORY_READ), rateLimit(60_000, 10), asyncHandler(async (req: any, res: any) => {
    const parsed = scenarioSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid aggregate planning inputs' });
    return res.json({ source: 'user_supplied_scenario', verifiedBusinessEvidence: false, forecast: forecastDemand(parsed.data) });
  }));

  app.get('/api/engineering/reliability', authenticateToken, requirePermission(PERMISSIONS.SYSTEM_CONFIGURE), (_req, res) => res.json(reliabilityWindow.snapshot()));
}
