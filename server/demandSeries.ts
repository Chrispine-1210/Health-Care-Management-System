import type { StockBatch, StockMovement } from '@shared/schema';

const DAY = 86_400_000;
const MALAWI_OFFSET = 2 * 3_600_000;
export const completeDayBoundary = (now: number) => Math.floor((now + MALAWI_OFFSET) / DAY) * DAY - MALAWI_OFFSET;

/** A count of recorded dispensing, never a claim of complete uncensored demand. */
export function buildDemandSeries(movements: StockMovement[], batches: StockBatch[], lookbackDays: number, now: number) {
  const until = completeDayBoundary(now);
  const since = until - lookbackDays * DAY;
  const counts = Array.from({ length: lookbackDays }, () => 0);
  let firstEvidence: number | null = null;
  for (const movement of movements) {
    const time = new Date(movement.createdAt).getTime();
    if (time < since || time >= until) continue;
    firstEvidence = firstEvidence === null ? time : Math.min(firstEvidence, time);
    if (movement.movementType === 'dispense' && movement.quantityDelta < 0) counts[Math.floor((time - since) / DAY)] += -movement.quantityDelta;
  }
  const availableStock = batches.filter((b) => b.status === 'active' && new Date(b.expiryDate).getTime() > now)
    .reduce((sum, b) => sum + Math.max(0, b.quantityOnHand - b.quantityReserved), 0);
  return { dailyCounts: counts, availableStock, since: new Date(since).toISOString(), until: new Date(until).toISOString(),
    timezone: 'Africa/Blantyre', firstEvidenceAt: firstEvidence === null ? null : new Date(firstEvidence).toISOString(),
    observedDays: firstEvidence === null ? 0 : Math.min(lookbackDays, Math.floor((until - completeDayBoundary(firstEvidence)) / DAY)),
    coverageVerified: false as const };
}
