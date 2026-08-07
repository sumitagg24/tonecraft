import { Redis } from "@upstash/redis";

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

// In-memory token bucket fallback when Redis is unconfigured
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowMs } = options;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const redis = new Redis({ url, token });
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.pexpire(key, windowMs);
      }
      const ttl = await redis.pttl(key);
      const remaining = Math.max(0, limit - current);
      return {
        success: current <= limit,
        limit,
        remaining,
        resetMs: ttl > 0 ? ttl : windowMs,
      };
    } catch {
      /* fallback to memory */
    }
  }

  // Memory fallback logic
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, resetMs: windowMs };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return {
    success: bucket.count <= limit,
    limit,
    remaining,
    resetMs: Math.max(0, bucket.resetAt - now),
  };
}
