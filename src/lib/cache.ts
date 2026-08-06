import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

/**
 * Phase 12.7 — Redis cache layer.
 *
 * Wraps Upstash Redis with TTL-aware get/set/del plus a `cacheWrap` helper for
 * read-through caching. **Fail-open**: when Upstash isn't configured the cache
 * is a no-op passthrough so a cache misconfiguration can never take the app
 * down (unlike rate limiting, which deliberately fails closed).
 */

const CONFIGURED = Boolean(
  process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    process.env.UPSTASH_REDIS_REST_URL !== "https://..."
);

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error("Upstash Redis is not configured");
    _redis = new Redis({ url, token });
  }
  return _redis;
}

const PREFIX = "cache:";

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!CONFIGURED) return null;
  try {
    return await getRedis().get<T>(PREFIX + key);
  } catch (error) {
    logger.warn("[Cache] get failed", error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (!CONFIGURED) return;
  try {
    await getRedis().set(PREFIX + key, value, { ex: ttlSeconds });
  } catch (error) {
    logger.warn("[Cache] set failed", error instanceof Error ? error.message : String(error));
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!CONFIGURED) return;
  try {
    await getRedis().del(PREFIX + key);
  } catch (error) {
    logger.warn("[Cache] del failed", error instanceof Error ? error.message : String(error));
  }
}

/**
 * Read-through: returns the cached value, or runs `loader`, stores the result,
 * and returns it. Never caches a rejected loader (only stores on success).
 */
export async function cacheWrap<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await loader();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

export function isCacheConfigured(): boolean {
  return CONFIGURED;
}
