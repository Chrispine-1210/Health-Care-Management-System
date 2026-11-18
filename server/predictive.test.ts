import assert from 'node:assert/strict';
import test from 'node:test';
import { forecastDemand, predictiveCdf, predictiveQuantile, wilsonInterval } from '../shared/predictive';
import { ReliabilityWindow } from './reliability';
import { buildDemandSeries, completeDayBoundary } from './demandSeries';
import type { StockBatch, StockMovement } from '../shared/schema';
import { canRetryRead, readRetryDelay } from '../shared/retryPolicy';

test('predictive probabilities and discrete quantiles match independent SciPy reference values', () => {
  // scipy.stats.nbinom.cdf/ppf, shape n, p=rate/(rate+days).
  for (const [shape, rate, days, k, cdf, lo, hi] of [
    [1,15,7,0,0.6818181818181818,0,2],
    [121,29,7,25,0.27752681239973087,20,40],
    [1,57,7,0,0.890625,0,1],
    [2001,57,14,500,0.6456157197467707,451,533],
    [2800001,29,90,8700000,0.9583239566626168,8679838,8699482],
  ]) {
    assert.ok(Math.abs(predictiveCdf(k, shape, rate, days) - cdf) < 2e-8);
    assert.equal(predictiveQuantile(.05, shape, rate, days), lo);
    assert.equal(predictiveQuantile(.95, shape, rate, days), hi);
  }
});

test('prediction separates parameter uncertainty, service quantile and stockout probability', () => {
  const input = { dailyCounts: Array(28).fill(4), availableStock: 20, leadTimeDays: 7 };
  const f = forecastDemand(input);
  assert.ok(Math.abs(f.expectedDemand - 7 * 113 / 29) < 1e-12);
  assert.ok(f.variance > f.expectedDemand);
  assert.ok(f.predictionInterval.lower <= f.expectedDemand && f.predictionInterval.upper >= f.expectedDemand);
  assert.equal(f.support, 'provisional');
  assert.equal(f.backtest.predictions, 14);
  assert.equal(f.automationAllowed, false);
  assert.ok(forecastDemand({ ...input, availableStock: 100 }).stockoutProbability < f.stockoutProbability);
  assert.ok(forecastDemand({ ...input, leadTimeDays: 14 }).targetStock >= f.targetStock);
  for (const q of [.8, .9, .95, .999]) {
    const k = predictiveQuantile(q, 113, 29, 7);
    assert.ok(predictiveCdf(k,113,29,7) >= q);
    assert.ok(k === 0 || predictiveCdf(k-1,113,29,7) < q);
  }
});

test('sparse, empty and unstable counts cannot issue a supported reorder suggestion', () => {
  assert.throws(() => forecastDemand({ dailyCounts: [], availableStock: 1, leadTimeDays: 7 }));
  for (const dailyCounts of [Array(14).fill(2), Array(28).fill(0), [...Array(14).fill(0), ...Array(14).fill(20)]]) {
    const f = forecastDemand({ dailyCounts, availableStock: 0, leadTimeDays: 7 });
    assert.equal(f.support, 'review_required');
    assert.equal(f.suggestedReorder, null);
    assert.ok(Number.isFinite(f.stockoutProbability));
  }
  for (const value of [NaN, Infinity, -1, 1.2, 100001]) assert.throws(() => forecastDemand({ dailyCounts: [...Array(27).fill(1), value], availableStock: 1, leadTimeDays: 7 }));
  assert.throws(() => predictiveQuantile(1, 10, 10, 7));
});

test('Wilson uncertainty does not turn zero failures into proof of perfect availability', () => {
  assert.deepEqual(wilsonInterval(0, 0), { lower: 0, upper: 1, estimate: null, observations: 0 });
  const interval = wilsonInterval(0, 100);
  assert.ok(interval.upper > .03 && interval.upper < .04);
  assert.ok(wilsonInterval(0, 1000).upper < interval.upper);
  assert.throws(() => wilsonInterval(2, 1));
});

test('reliability window is bounded, expires observations and keeps empty latency unknown', () => {
  const window = new ReliabilityWindow(3, 100);
  assert.equal(window.snapshot(1000).p95LatencyMs, null);
  [200,500,429,403].forEach((status,i) => window.record(status, 10+i, 1000));
  const s = window.snapshot(1000);
  assert.equal(s.requests, 3);
  assert.equal(s.serverErrors, 1);
  assert.equal(s.authorizationDenials, 1);
  assert.equal(s.rateLimited, 1);
  assert.equal(window.snapshot(1101).serverErrorRate.estimate, null);
});

test('read retries are bounded, transient-only and jittered', () => {
  for (const status of [400,401,403,404,409,422,500]) assert.equal(canRetryRead(0,status),false);
  for (const status of [408,429,502,503,504,undefined]) assert.equal(canRetryRead(0,status),true);
  assert.equal(canRetryRead(2,503),false);
  assert.equal(readRetryDelay(0,0.5),125);
  assert.equal(readRetryDelay(20,1),2000);
});

test('dispensing series respects Malawi midnight and excludes reservations, returns and unsafe stock', () => {
  const now = Date.parse('2026-11-18T00:30:00Z');
  assert.equal(new Date(completeDayBoundary(now)).toISOString(), '2026-11-17T22:00:00.000Z');
  const movements = [
    { createdAt: new Date('2026-11-16T22:01:00Z'), movementType: 'dispense', quantityDelta: -3 },
    { createdAt: new Date('2026-11-17T21:59:59Z'), movementType: 'dispense', quantityDelta: -2 },
    { createdAt: new Date('2026-11-17T22:00:00Z'), movementType: 'dispense', quantityDelta: -100 },
    { createdAt: new Date('2026-11-17T10:00:00Z'), movementType: 'reservation', quantityDelta: -30 },
    { createdAt: new Date('2026-11-17T10:00:00Z'), movementType: 'return', quantityDelta: 10 },
  ] as StockMovement[];
  const batches = [
    { status: 'active', quantityOnHand: 20, quantityReserved: 5, expiryDate: new Date('2030-01-01') },
    { status: 'quarantined', quantityOnHand: 100, quantityReserved: 0, expiryDate: new Date('2030-01-01') },
    { status: 'active', quantityOnHand: 100, quantityReserved: 0, expiryDate: new Date('2026-11-01') },
  ] as StockBatch[];
  const series = buildDemandSeries(movements,batches,14,now);
  assert.equal(series.dailyCounts.at(-1), 5);
  assert.equal(series.availableStock,15);
  assert.equal(series.coverageVerified,false);
});
