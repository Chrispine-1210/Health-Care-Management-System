/**
 * Simple Cache Manager for API responses
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

export const cacheManager = {
  set: (key: string, data: any, ttl: number = 3600) => {
    cache.set(key, { data, timestamp: Date.now(), ttl });
  },

  get: (key: string) => {
    const entry = cache.get(key);
    if (!entry) return null;

    const age = (Date.now() - entry.timestamp) / 1000;
    if (age > entry.ttl) {
      cache.delete(key);
      return null;
    }

    return entry.data;
  },

  invalidate: (pattern?: string) => {
    if (!pattern) {
      cache.clear();
      return;
    }

    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  },

  stats: () => ({
    size: cache.size,
    entries: Array.from(cache.keys()),
  }),
};
