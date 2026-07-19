/**
 * Upstash Redis — Infinity Legal ZA
 *
 * Conditionally enabled: when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * are set, Redis handles caching + rate limiting. When absent, the app falls
 * back to the existing in-memory cache/rate-limiter (no behavior change).
 *
 * To activate Upstash:
 * 1. Create a database at https://console.upstash.com
 * 2. Copy the REST URL and REST Token
 * 3. Add to .env:
 *      UPSTASH_REDIS_REST_URL=https://xxx-xxx.upstash.io
 *      UPSTASH_REDIS_REST_TOKEN=AXXX...
 *
 * Use cases:
 *   - Caching dashboard stats, pricing, articles (TTL)
 *   - Distributed rate limiting (works across serverless instances)
 *   - Session/token blacklists
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// ============================================
// CONFIG
// ============================================

export const isUpstashEnabled: boolean = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// ============================================
// LAZY SINGLETON
// ============================================

let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
  if (!isUpstashEnabled) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redisClient;
}

// ============================================
// CACHE HELPERS (with graceful in-memory fallback)
// ============================================

const memoryCache = new Map<string, { value: unknown; expires: number }>();

/** Get a cached value. Falls back to in-memory cache when Upstash is absent. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  // Upstash path
  const redis = getRedis();
  if (redis) {
    try {
      const v = await redis.get<T>(key);
      return v ?? null;
    } catch (e) {
      console.error('[Upstash] cacheGet error, falling back to memory:', (e as Error).message);
    }
  }
  // Memory fallback
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

/** Set a cached value with TTL in seconds. Falls back to in-memory cache. */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
      return;
    } catch (e) {
      console.error('[Upstash] cacheSet error, falling back to memory:', (e as Error).message);
    }
  }
  memoryCache.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

/** Invalidate a cached key. */
export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try { await redis.del(key); } catch { /* ignore */ }
  }
  memoryCache.delete(key);
}

// ============================================
// RATE LIMITER (distributed, falls back to in-memory)
// ============================================

let apiRatelimit: Ratelimit | null = null;

export function getApiRatelimiter(): Ratelimit | null {
  if (!isUpstashEnabled) return null;
  if (!apiRatelimit) {
    apiRatelimit = new Ratelimit({
      redis: getRedis()!,
      limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 req/min default
      prefix: 'il:api',
      analytics: true,
    });
  }
  return apiRatelimit;
}

/**
 * Check rate limit. Returns { success, limit, remaining, reset }.
 * When Upstash is disabled, always succeeds (in-memory limiter handles it elsewhere).
 */
export async function checkUpstashRateLimit(
  identifier: string,
  limit = 60,
  window = '1 m'
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limiter = getApiRatelimiter();
  if (!limiter) {
    return { success: true, limit, remaining: limit, reset: Date.now() + 60_000 };
  }
  try {
    const { success, limit: lim, remaining, reset } = await limiter.limit(identifier);
    return { success, limit: lim, remaining, reset };
  } catch (e) {
    console.error('[Upstash] rate limit error, allowing:', (e as Error).message);
    return { success: true, limit, remaining: limit, reset: Date.now() + 60_000 };
  }
}

// ============================================
// STATUS HELPER
// ============================================

export function getUpstashStatus() {
  return {
    enabled: isUpstashEnabled,
    urlConfigured: !!process.env.UPSTASH_REDIS_REST_URL,
    tokenConfigured: !!process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}
