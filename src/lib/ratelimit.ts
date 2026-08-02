import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

/**
 * Rate limiting for LLM-costly and abuse-prone endpoints.
 *
 * Fail-closed contract (audit 12 P0.8): when Upstash is not configured,
 * production requests are DENIED (loud error) rather than silently allowed
 * with no limit. Development keeps a permissive fallback so local work is
 * not blocked.
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
    if (!url || !token) {
      // Callers gate on CONFIGURED first; this is a defensive guard.
      throw new Error("Upstash Redis is not configured");
    }
    _redis = new Redis({ url, token });
  }
  return _redis;
}

let _freeHourly: Ratelimit | null = null;
function getFreeHourly() {
  if (!_freeHourly) {
    _freeHourly = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "ratelimit:free:hourly",
    });
  }
  return _freeHourly;
}

let _freeDaily: Ratelimit | null = null;
function getFreeDaily() {
  if (!_freeDaily) {
    _freeDaily = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(50, "24 h"),
      analytics: true,
      prefix: "ratelimit:free:daily",
    });
  }
  return _freeDaily;
}

let _proHourly: Ratelimit | null = null;
function getProHourly() {
  if (!_proHourly) {
    _proHourly = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(100, "1 h"),
      analytics: true,
      prefix: "ratelimit:pro:hourly",
    });
  }
  return _proHourly;
}

export interface RateLimitCheck {
  allowed: boolean;
  limit: number;
  window: string;
  remaining: number;
}

let _unconfiguredWarned = false;
function unconfiguredCheck(): RateLimitCheck {
  // Log the misconfiguration once per process, not per request (avoids log/report spam).
  if (!_unconfiguredWarned) {
    _unconfiguredWarned = true;
    if (process.env.NODE_ENV === "production") {
      logger.error(
        "Rate limiting is not configured (UPSTASH_REDIS_REST_URL/TOKEN missing). Failing closed.",
      );
    } else {
      // Dev fallback: permissive, but visible so it never silently ships.
      logger.warn(
        "Rate limiting is not configured (UPSTASH_REDIS_REST_URL/TOKEN missing). Allowing in development.",
      );
    }
  }
  if (process.env.NODE_ENV === "production") {
    return { allowed: false, limit: 0, window: "hour", remaining: 0 };
  }
  return { allowed: true, limit: Number.MAX_SAFE_INTEGER, window: "hour", remaining: Number.MAX_SAFE_INTEGER };
}

export async function checkMessageLimit(userId: string, plan: string): Promise<RateLimitCheck> {
  if (!CONFIGURED) {
    return unconfiguredCheck();
  }

  if (plan === "pro" || plan === "enterprise") {
    const { success, remaining } = await getProHourly().limit(userId);
    return { allowed: success, limit: 100, window: "hour", remaining: remaining ?? 0 };
  }
  const [hourly, daily] = await Promise.all([
    getFreeHourly().limit(userId),
    getFreeDaily().limit(userId),
  ]);
  if (!daily.success) {
    return { allowed: false, limit: 50, window: "day", remaining: 0 };
  }
  if (!hourly.success) {
    return { allowed: false, limit: 10, window: "hour", remaining: daily.remaining ?? 0 };
  }
  return { allowed: true, limit: 50, window: "day", remaining: daily.remaining ?? 0 };
}

/** True when Upstash is configured (used by startup validation to decide strictness). */
export function isRateLimitConfigured(): boolean {
  return CONFIGURED;
}
