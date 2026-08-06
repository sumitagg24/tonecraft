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

// ── Phase 12.4: per-dimension limiters ──────────────────────────────

let _ipLimiter: Ratelimit | null = null;
function getIpLimiter() {
  if (!_ipLimiter) {
    _ipLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(120, "1 m"), // 120 req/min per IP
      prefix: "ratelimit:ip:minute",
    });
  }
  return _ipLimiter;
}

let _burstLimiter: Ratelimit | null = null;
function getBurstLimiter() {
  if (!_burstLimiter) {
    _burstLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "1 s"), // 10 req/s burst ceiling
      prefix: "ratelimit:burst:second",
    });
  }
  return _burstLimiter;
}

const _endpointLimiters = new Map<string, Ratelimit>();
function getEndpointLimiter(endpoint: string, limit: number) {
  const key = `${endpoint}:${limit}`;
  let limiter = _endpointLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, "1 m"),
      prefix: `ratelimit:endpoint:${endpoint}`,
    });
    _endpointLimiters.set(key, limiter);
  }
  return limiter;
}

const _providerLimiters = new Map<string, Ratelimit>();
function getProviderLimiter(provider: string, limit: number) {
  let limiter = _providerLimiters.get(provider);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, "1 h"),
      prefix: `ratelimit:provider:${provider}`,
    });
    _providerLimiters.set(provider, limiter);
  }
  return limiter;
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

// ── Phase 12.4: dimension helpers ───────────────────────────────────

/**
 * Per-IP guard for abuse-prone endpoints. Identifier is the normalized IP
 * (or a supplied key); keyed per minute.
 */
export async function checkIpLimit(ip: string, limit = 120): Promise<RateLimitCheck> {
  if (!CONFIGURED) return unconfiguredCheck();
  const { success, remaining } = await getIpLimiter().limit(ip || "unknown");
  return { allowed: success, limit, window: "minute", remaining: remaining ?? 0 };
}

/**
 * Burst ceiling — protects downstream providers from short-window spikes.
 * Keyed by userId or IP.
 */
export async function checkBurstLimit(key: string, limit = 10): Promise<RateLimitCheck> {
  if (!CONFIGURED) return unconfiguredCheck();
  const { success, remaining } = await getBurstLimiter().limit(key || "unknown");
  return { allowed: success, limit, window: "second", remaining: remaining ?? 0 };
}

/** Per-endpoint guard (e.g. export:10/min per user). */
export async function checkEndpointLimit(
  endpoint: string,
  userId: string,
  limit = 10
): Promise<RateLimitCheck> {
  if (!CONFIGURED) return unconfiguredCheck();
  const { success, remaining } = await getEndpointLimiter(endpoint, limit).limit(userId);
  return { allowed: success, limit, window: "minute", remaining: remaining ?? 0 };
}

/**
 * Per-provider budget — guards a single AI provider (or the whole engine)
 * from being hammered by one account. `key` is provider+userId (or userId).
 */
export async function checkProviderLimit(
  provider: string,
  key: string,
  limit = 60
): Promise<RateLimitCheck> {
  if (!CONFIGURED) return unconfiguredCheck();
  const { success, remaining } = await getProviderLimiter(provider, limit).limit(key);
  return { allowed: success, limit, window: "hour", remaining: remaining ?? 0 };
}
