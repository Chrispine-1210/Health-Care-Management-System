/** Auditable, non-clinical Gamma–Poisson demand baseline. Gamma uses shape/rate. */
export const MODEL_VERSION = 'gamma-poisson-v1';
const MAX_COUNT = 100_000;
const clamp = (x: number) => Math.min(1, Math.max(0, x));

function logGamma(z: number): number {
  const c = [676.5203681218851, -1259.1392167224028, 771.3234287776531,
    -176.6150291621406, 12.507343278686905, -0.13857109526572012,
    9.984369578019572e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = 0.9999999999998099;
  for (let i = 0; i < c.length; i++) x += c[i] / (z + i + 1);
  const t = z + c.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaFraction(a: number, b: number, x: number): number {
  const tiny = 1e-300;
  const safe = (v: number) => Math.abs(v) < tiny ? (v < 0 ? -tiny : tiny) : v;
  let c = 1;
  let d = 1 / safe(1 - (a + b) * x / (a + 1));
  let h = d;
  for (let m = 1; m <= 4096; m++) {
    let aa = m * (b - m) * x / ((a - 1 + 2 * m) * (a + 2 * m));
    d = 1 / safe(1 + aa * d);
    c = safe(1 + aa / c);
    h *= d * c;
    aa = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 1 + 2 * m));
    d = 1 / safe(1 + aa * d);
    c = safe(1 + aa / c);
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 3e-12) return h;
  }
  throw new RangeError('Predictive probability did not converge');
}

function betaCdf(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b)
    + a * Math.log(x) + b * Math.log1p(-x));
  return clamp(x < (a + 1) / (a + b + 2)
    ? front * betaFraction(a, b, x) / a
    : 1 - front * betaFraction(b, a, 1 - x) / b);
}

/** P(D <= k), for a negative-binomial posterior predictive distribution. */
export function predictiveCdf(k: number, shape: number, rate: number, days: number): number {
  if (![k, shape, rate, days].every(Number.isFinite) || shape <= 0 || rate <= 0 || days <= 0) {
    throw new RangeError('Invalid predictive parameters');
  }
  if (k < 0) return 0;
  return betaCdf(rate / (rate + days), shape, Math.floor(k) + 1);
}

export function predictiveSurvival(k: number, shape: number, rate: number, days: number): number {
  if (![k, shape, rate, days].every(Number.isFinite) || shape <= 0 || rate <= 0 || days <= 0) throw new RangeError('Invalid predictive parameters');
  if (k < 0) return 1;
  // Evaluate the complementary beta directly, avoiding subtraction near one.
  return betaCdf(days / (rate + days), Math.floor(k) + 1, shape);
}

export function predictiveQuantile(q: number, shape: number, rate: number, days: number): number {
  if (!Number.isFinite(q) || q <= 0 || q >= 1) throw new RangeError('Quantile must be between zero and one');
  let low = -1;
  let high = Math.max(1, Math.ceil(shape * days / rate));
  while (predictiveCdf(high, shape, rate, days) < q) {
    high *= 2;
    if (high > 1e9) throw new RangeError('Predictive range exceeds supported planning size');
  }
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (predictiveCdf(mid, shape, rate, days) >= q) high = mid;
    else low = mid;
  }
  return high;
}

export interface DemandInput {
  dailyCounts: number[];
  availableStock: number;
  leadTimeDays: number;
  serviceLevel?: number;
}

export function forecastDemand(input: DemandInput) {
  const { dailyCounts, availableStock, leadTimeDays, serviceLevel = 0.95 } = input;
  if (dailyCounts.length < 14 || dailyCounts.length > 365
    || dailyCounts.some((n) => !Number.isSafeInteger(n) || n < 0 || n > MAX_COUNT)
    || !Number.isSafeInteger(availableStock) || availableStock < 0 || availableStock > 1e8
    || !Number.isInteger(leadTimeDays) || leadTimeDays < 1 || leadTimeDays > 90
    || !Number.isFinite(serviceLevel) || serviceLevel < 0.8 || serviceLevel > 0.999) {
    throw new RangeError('Use 14–365 complete daily counts, valid stock, 1–90 lead days and service level 0.8–0.999');
  }
  const total = dailyCounts.reduce((sum, n) => sum + n, 0);
  const shape = 1 + total;
  const rate = 1 + dailyCounts.length;
  const mean = shape * leadTimeDays / rate;
  const variance = mean * (1 + leadTimeDays / rate);
  const target = predictiveQuantile(serviceLevel, shape, rate, leadTimeDays);
  const observedMean = total / dailyCounts.length;
  const observedVariance = dailyCounts.reduce((sum, n) => sum + (n - observedMean) ** 2, 0) / (dailyCounts.length - 1);
  const dispersion = observedMean > 0 ? observedVariance / observedMean : null;
  const half = Math.floor(dailyCounts.length / 2);
  const firstMean = dailyCounts.slice(0, half).reduce((s, n) => s + n, 0) / half;
  const lastMean = dailyCounts.slice(half).reduce((s, n) => s + n, 0) / (dailyCounts.length - half);
  const unstable = Math.abs(lastMean - firstMean) > Math.max(1, 0.5 * observedMean);
  const reasons = [
    ...(total === 0 ? ['No positive demand observations.'] : []),
    ...(dailyCounts.length < 28 ? ['Fewer than 28 complete days.'] : []),
    ...(dispersion !== null && dispersion > 2 ? ['Demand is overdispersed relative to the Poisson assumption.'] : []),
    ...(unstable ? ['Demand changed materially across the observation window.'] : []),
  ];
  // Prequential one-day checks: each holdout uses only observations before it.
  let absError = 0, covered = 0, tested = 0, running = 1;
  for (let i = 0; i < dailyCounts.length; i++) {
    if (i >= 14) {
      absError += Math.abs(dailyCounts[i] - running / (i + 1));
      const lo = predictiveQuantile(0.05, running, i + 1, 1);
      const hi = predictiveQuantile(0.95, running, i + 1, 1);
      if (dailyCounts[i] >= lo && dailyCounts[i] <= hi) covered++;
      tested++;
    }
    running += dailyCounts[i];
  }
  if (tested >= 14 && covered / tested < 0.8) reasons.push('Rolling prediction interval coverage is below 80%; model fit needs review.');
  const support = reasons.length === 0 ? 'provisional' : 'review_required';
  return {
    modelVersion: MODEL_VERSION,
    support,
    reasons,
    observationDays: dailyCounts.length,
    observedUnits: total,
    posterior: { shape, rate, priorShape: 1, priorRate: 1 },
    dailyMean: shape / rate,
    leadTimeDays,
    expectedDemand: mean,
    variance,
    predictionInterval: { level: 0.9, lower: predictiveQuantile(0.05, shape, rate, leadTimeDays), upper: predictiveQuantile(0.95, shape, rate, leadTimeDays) },
    stockoutProbability: predictiveSurvival(availableStock, shape, rate, leadTimeDays),
    availableStock,
    serviceLevel,
    targetStock: target,
    suggestedReorder: support === 'provisional' ? Math.max(0, target - availableStock) : null,
    backtest: { predictions: tested, meanAbsoluteError: tested ? absError / tested : null, intervalCoverage: tested ? covered / tested : null },
    assumptions: ['Complete uncensored daily observations; zeros mean observed zero demand.', 'Constant demand rate and fixed supplier lead time.', 'No seasonality, unmet demand, on-order stock or supplier disruption modeled.', 'Dispensing counts are a proxy for demand and may be censored by stockouts.'],
    automationAllowed: false,
  } as const;
}

export type DemandForecast = ReturnType<typeof forecastDemand>;

/** Two-sided 95% Wilson interval; zero observations remain unknown. */
export function wilsonInterval(failures: number, total: number) {
  if (!Number.isSafeInteger(failures) || !Number.isSafeInteger(total) || failures < 0 || total < failures) throw new RangeError('Invalid event counts');
  if (total === 0) return { lower: 0, upper: 1, estimate: null, observations: 0 };
  const z = 1.959963984540054;
  const p = failures / total;
  const denominator = 1 + z * z / total;
  const center = (p + z * z / (2 * total)) / denominator;
  const radius = z * Math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator;
  return { lower: clamp(center - radius), upper: clamp(center + radius), estimate: p, observations: total };
}
