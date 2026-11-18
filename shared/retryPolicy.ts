export function canRetryRead(failureCount: number, status?: number): boolean {
  return failureCount < 2 && (status === undefined || [408, 429, 502, 503, 504].includes(status));
}
/** Full jitter: U(0, min(2s, 250ms × 2^attempt)). Mutations never use it. */
export function readRetryDelay(attempt: number, random = Math.random()): number {
  return Math.floor(Math.min(2000, 250 * 2 ** Math.min(10, Math.max(0, attempt))) * Math.min(1, Math.max(0, random)));
}
