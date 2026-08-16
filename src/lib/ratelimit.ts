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

// ── Configuration ───────────────────────────────────────────────────────────
// Every threshold is env-overridable (RATE_LIMIT_*). Nothing is hardcoded at
// call sites; the defaults below are the safe out-of-the-box values.

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const rateLimitConfig = {
  /** Authentication routes — strict per-IP windows + exponential cooldown. */
  auth: {
    // Actual credential submissions (Clerk sign-in / sign-up attempts, per IP).
    // (Page loads are NOT limited — Clerk components prefetch /sign-in and
    // /sign-up as RSC fetches from every public page, so throttling pages
    // would block legitimate traffic.)
    attemptPerIpPerMinute: num("RATE_LIMIT_AUTH_ATTEMPT_PER_IP_PER_MIN", 20),
    // Exponential backoff rather than a hard lockout: each consecutive
    // violation doubles the cooldown, from base up to max, then it decays.
    backoffBaseSeconds: num("RATE_LIMIT_AUTH_BACKOFF_BASE_SECONDS", 30),
    backoffMaxSeconds: num("RATE_LIMIT_AUTH_BACKOFF_MAX_SECONDS", 1800),
  },
  /** Public (unauthenticated) endpoints — moderate per-IP ceiling. */
  public: {
    perIpPerMinute: num("RATE_LIMIT_PUBLIC_PER_IP_PER_MIN", 30),
  },
  /** Authenticated user actions — loose ceilings (per IP + per user). */
  authed: {
    perIpPerMinute: num("RATE_LIMIT_AUTHED_IP_PER_MIN", 2000),
    perUserPerMinute: num("RATE_LIMIT_AUTHED_USER_PER_MIN", 1200),
  },
  /** Free-plan AI message budgets (per user). */
  plans: {
    freeHourly: num("RATE_LIMIT_FREE_HOURLY", 10),
    freeDaily: num("RATE_LIMIT_FREE_DAILY", 50),
    proHourly: num("RATE_LIMIT_PRO_HOURLY", 100),
  },
} as const;

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
      limiter: Ratelimit.slidingWindow(rateLimitConfig.plans.freeHourly, "1 h"),
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
      limiter: Ratelimit.slidingWindow(rateLimitConfig.plans.freeDaily, "24 h"),
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
      limiter: Ratelimit.slidingWindow(rateLimitConfig.plans.proHourly, "1 h"),
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

  const { plans } = rateLimitConfig;
  if (plan === "pro" || plan === "enterprise") {
    const { success, remaining } = await getProHourly().limit(userId);
    return { allowed: success, limit: plans.proHourly, window: "hour", remaining: remaining ?? 0 };
  }
  const [hourly, daily] = await Promise.all([
    getFreeHourly().limit(userId),
    getFreeDaily().limit(userId),
  ]);
  if (!daily.success) {
    return { allowed: false, limit: plans.freeDaily, window: "day", remaining: 0 };
  }
  if (!hourly.success) {
    return { allowed: false, limit: plans.freeHourly, window: "hour", remaining: daily.remaining ?? 0 };
  }
  return { allowed: true, limit: plans.freeDaily, window: "day", remaining: daily.remaining ?? 0 };
}

// ── Tier limiters (auth / public / authed) ────────────────────────────

let _authAttemptLimiter: Ratelimit | null = null;
function getAuthAttemptLimiter() {
  if (!_authAttemptLimiter) {
    _authAttemptLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(rateLimitConfig.auth.attemptPerIpPerMinute, "1 m"),
      prefix: "ratelimit:auth:attempt",
    });
  }
  return _authAttemptLimiter;
}

let _publicIpLimiter: Ratelimit | null = null;
function getPublicIpLimiter() {
  if (!_publicIpLimiter) {
    _publicIpLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(rateLimitConfig.public.perIpPerMinute, "1 m"),
      prefix: "ratelimit:public:ip",
    });
  }
  return _publicIpLimiter;
}

let _authedIpLimiter: Ratelimit | null = null;
function getAuthedIpLimiter() {
  if (!_authedIpLimiter) {
    _authedIpLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(rateLimitConfig.authed.perIpPerMinute, "1 m"),
      prefix: "ratelimit:authed:ip",
    });
  }
  return _authedIpLimiter;
}

let _authedUserLimiter: Ratelimit | null = null;
function getAuthedUserLimiter() {
  if (!_authedUserLimiter) {
    _authedUserLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(rateLimitConfig.authed.perUserPerMinute, "1 m"),
      prefix: "ratelimit:authed:user",
    });
  }
  return _authedUserLimiter;
}

/**
 * Auth-route guard (credential submissions) with exponential backoff instead
 * of a hard lockout: a per-IP window, plus a cooldown that doubles with each
 * consecutive violation (base → max seconds) and decays once the IP stops
 * trying. Per-account attempt limits are enforced natively by Clerk's
 * password policy; this is the defense-in-depth layer.
 *
 * Returns `retryAfterSeconds` when rejected so callers can set Retry-After.
 */
export async function checkAuthRouteLimit(
  ip: string
): Promise<RateLimitCheck & { retryAfterSeconds?: number }> {
  if (!CONFIGURED) return unconfiguredCheck();
  const redis = getRedis();
  const key = ip || "unknown";
  const cooldownKey = `ratelimit:auth:cooldown:${key}`;
  const violationsKey = `ratelimit:auth:violations:${key}`;
  const max = rateLimitConfig.auth.backoffMaxSeconds;

  // Active exponential cooldown? Reject immediately with the remaining time.
  const ttl = await redis.ttl(cooldownKey);
  if (ttl > 0) {
    return {
      allowed: false,
      limit: rateLimitConfig.auth.attemptPerIpPerMinute,
      window: "minute",
      remaining: 0,
      retryAfterSeconds: ttl,
    };
  }

  const { success, remaining } = await getAuthAttemptLimiter().limit(key);
  if (success) {
    // The IP is behaving again — clear the violation counter so the backoff
    // (and any future cooldown) starts from scratch.
    await redis.del(violationsKey).catch(() => {});
    return {
      allowed: true,
      limit: rateLimitConfig.auth.attemptPerIpPerMinute,
      window: "minute",
      remaining: remaining ?? 0,
    };
  }

  // Over the window: grow the cooldown exponentially per consecutive violation.
  const violations = await redis.incr(violationsKey);
  await redis.expire(violationsKey, max);
  const cooldown = Math.min(
    rateLimitConfig.auth.backoffBaseSeconds * Math.pow(2, Math.max(0, violations - 1)),
    max
  );
  // The cooldown key must expire after the COMPUTED cooldown, not the cap:
  // `ex: max` made ttl() report ~max on the first violation, effectively a
  // 30-minute hard lockout instead of the intended 30s base (caught live).
  // The violation counter keeps its own max-length lifetime via expire() above.
  await redis.set(cooldownKey, String(Date.now() + cooldown * 1000), { ex: cooldown });
  return {
    allowed: false,
    limit: rateLimitConfig.auth.attemptPerIpPerMinute,
    window: "minute",
    remaining: 0,
    retryAfterSeconds: cooldown,
  };
}

/** Moderate per-IP ceiling for public (unauthenticated) endpoints. */
export async function checkPublicIpLimit(ip: string): Promise<RateLimitCheck> {
  if (!CONFIGURED) return unconfiguredCheck();
  const { success, remaining } = await getPublicIpLimiter().limit(ip || "unknown");
  return {
    allowed: success,
    limit: rateLimitConfig.public.perIpPerMinute,
    window: "minute",
    remaining: remaining ?? 0,
  };
}

/** Loose per-IP ceiling for authenticated requests. */
export async function checkAuthedIpLimit(ip: string): Promise<RateLimitCheck> {
  if (!CONFIGURED) return unconfiguredCheck();
  const { success, remaining } = await getAuthedIpLimiter().limit(ip || "unknown");
  return {
    allowed: success,
    limit: rateLimitConfig.authed.perIpPerMinute,
    window: "minute",
    remaining: remaining ?? 0,
  };
}

/** Loose per-user ceiling for authenticated requests. */
export async function checkAuthedUserLimit(userId: string): Promise<RateLimitCheck> {
  if (!CONFIGURED) return unconfiguredCheck();
  const { success, remaining } = await getAuthedUserLimiter().limit(userId || "unknown");
  return {
    allowed: success,
    limit: rateLimitConfig.authed.perUserPerMinute,
    window: "minute",
    remaining: remaining ?? 0,
  };
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
