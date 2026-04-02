/**
 * Caching Strategies - Different cache invalidation approaches
 */

export const CACHE_STRATEGIES = {
  // Invalidate entire cache (aggressive)
  CLEAR_ALL: () => {
    // Clear all caches
  },

  // Invalidate by pattern (moderate)
  INVALIDATE_PATTERN: (pattern: string) => {
    // Invalidate matching keys
  },

  // TTL-based invalidation (lazy)
  TTL: (key: string, ttl: number) => {
    // Auto-invalidate after TTL
  },

  // Event-based invalidation (reactive)
  EVENT: (event: string) => {
    // Invalidate on specific events
  },
};

export interface CacheConfig {
  strategy: keyof typeof CACHE_STRATEGIES;
  ttl: number;
  key: string;
}

export const DEFAULT_CACHE_CONFIG: Record<string, CacheConfig> = {
  '/api/products': { strategy: 'TTL', ttl: 3600, key: 'products' },
  '/api/branches': { strategy: 'TTL', ttl: 7200, key: 'branches' },
  '/api/orders': { strategy: 'EVENT', ttl: 600, key: 'orders' },
  '/api/prescriptions': { strategy: 'EVENT', ttl: 600, key: 'prescriptions' },
};
