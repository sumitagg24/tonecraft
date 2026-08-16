import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from "@jest/globals";

// NODE_ENV is read-only in @types/node; tests flip it through this cast.
const setNodeEnv = (value: string | undefined) => {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
};

// ── Mocks ────────────────────────────────────────────────────────────────
// The ratelimit module constructs `new Redis(...)` / `new Ratelimit(...)` lazily,
// so we substitute an in-memory store and controllable limiters. `jest.resetModules()`
// + dynamic import gives each describe a fresh module instance (and fresh mocks).

type StoreEntry = { value: unknown; expiresAt: number | null };
type RedisStore = Map<string, StoreEntry>;
type LimitResult = { success: boolean; remaining: number; reset: number };
type Limiter = { limit: jest.Mock<() => Promise<LimitResult>> };

jest.mock("@upstash/redis", () => {
  const store: RedisStore = new Map();
  return {
    Redis: jest.fn().mockImplementation(() => ({
      get: jest.fn(async (key: string) => {
        const cur = store.get(key);
        if (!cur) return null;
        if (cur.expiresAt != null && cur.expiresAt <= Date.now()) return null;
        return cur.value;
      }),
      set: jest.fn(async (key: string, value: unknown, opts?: { ex?: number }) => {
        store.set(key, {
          value,
          expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : null,
        });
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key);
      }),
      ttl: jest.fn(async (key: string) => {
        const cur = store.get(key);
        if (!cur) return -2;
        if (cur.expiresAt == null) return -1;
        return Math.max(0, Math.ceil((cur.expiresAt - Date.now()) / 1000));
      }),
      incr: jest.fn(async (key: string) => {
        const cur = store.get(key);
        const n = (typeof cur?.value === "number" ? cur.value : 0) + 1;
        store.set(key, { value: n, expiresAt: null });
        return n;
      }),
      expire: jest.fn(async (key: string, seconds: number) => {
        const cur = store.get(key);
        store.set(key, { value: cur ? cur.value : 1, expiresAt: Date.now() + seconds * 1000 });
        return 1;
      }),
    })),
    __store: store,
  };
});

jest.mock("@upstash/ratelimit", () => {
  const limiters = new Map<string, Limiter>();
  const Ratelimit = jest.fn<(opts: { prefix: string }) => Limiter>().mockImplementation((opts) => {
    const limiter: Limiter = {
      limit: jest
        .fn<() => Promise<LimitResult>>()
        .mockImplementation(async () => ({ success: true, remaining: 999, reset: 0 })),
    };
    limiters.set(opts.prefix, limiter);
    return limiter;
  });
  (Ratelimit as unknown as { slidingWindow: unknown }).slidingWindow = jest.fn(() => ({}));
  return { Ratelimit, __limiters: limiters };
});

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/error-reporting", () => ({
  reportError: jest.fn(),
}));

// ── Env helpers ──────────────────────────────────────────────────────────

const RATE_LIMIT_ENV_KEYS = [
  "RATE_LIMIT_AUTH_ATTEMPT_PER_IP_PER_MIN",
  "RATE_LIMIT_AUTH_BACKOFF_BASE_SECONDS",
  "RATE_LIMIT_AUTH_BACKOFF_MAX_SECONDS",
  "RATE_LIMIT_PUBLIC_PER_IP_PER_MIN",
  "RATE_LIMIT_AUTHED_IP_PER_MIN",
  "RATE_LIMIT_AUTHED_USER_PER_MIN",
] as const;

const REAL_URL = process.env.UPSTASH_REDIS_REST_URL;
const REAL_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REAL_NODE_ENV = process.env.NODE_ENV;
const REAL_RATE_LIMIT: Record<string, string | undefined> = {};
for (const key of RATE_LIMIT_ENV_KEYS) REAL_RATE_LIMIT[key] = process.env[key];

afterAll(() => {
  if (REAL_URL === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
  else process.env.UPSTASH_REDIS_REST_URL = REAL_URL;
  if (REAL_TOKEN === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
  else process.env.UPSTASH_REDIS_REST_TOKEN = REAL_TOKEN;
  setNodeEnv(REAL_NODE_ENV);
  for (const key of RATE_LIMIT_ENV_KEYS) {
    const real = REAL_RATE_LIMIT[key];
    if (real === undefined) delete process.env[key];
    else process.env[key] = real;
  }
});

/** Reset the module registry and import `@/lib/ratelimit` with the given env. */
async function loadRatelimit(env: Record<string, string | undefined>) {
  for (const key of RATE_LIMIT_ENV_KEYS) {
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  if (env.UPSTASH_REDIS_REST_URL === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
  else process.env.UPSTASH_REDIS_REST_URL = env.UPSTASH_REDIS_REST_URL;
  if (env.UPSTASH_REDIS_REST_TOKEN === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
  else process.env.UPSTASH_REDIS_REST_TOKEN = env.UPSTASH_REDIS_REST_TOKEN;
  jest.resetModules();
  return import("@/lib/ratelimit");
}

function redisStore(): RedisStore {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- post-resetModules registry access
  return (require("@upstash/redis") as { __store: RedisStore }).__store;
}

function limiters(): Map<string, Limiter> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- post-resetModules registry access
  return (require("@upstash/ratelimit") as { __limiters: Map<string, Limiter> }).__limiters;
}

/** Fetch a limiter by prefix, failing loudly if the test forgot to prime it. */
function limiterByPrefix(prefix: string): Limiter {
  const limiter = limiters().get(prefix);
  if (!limiter) throw new Error(`limiter not primed: ${prefix}`);
  return limiter;
}

// ── Config tiers ─────────────────────────────────────────────────────────

describe("rateLimitConfig — thresholds are env-configurable, not hardcoded", () => {
  let ratelimit: typeof import("@/lib/ratelimit");

  beforeAll(async () => {
    ratelimit = await loadRatelimit({
      UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
      RATE_LIMIT_AUTH_ATTEMPT_PER_IP_PER_MIN: "7",
      RATE_LIMIT_AUTH_BACKOFF_BASE_SECONDS: "5",
      RATE_LIMIT_AUTH_BACKOFF_MAX_SECONDS: "50",
      RATE_LIMIT_PUBLIC_PER_IP_PER_MIN: "11",
      RATE_LIMIT_AUTHED_IP_PER_MIN: "99",
      RATE_LIMIT_AUTHED_USER_PER_MIN: "88",
    });
  });

  it("reads every tier from RATE_LIMIT_* env vars", () => {
    expect(ratelimit.rateLimitConfig.auth.attemptPerIpPerMinute).toBe(7);
    expect(ratelimit.rateLimitConfig.auth.backoffBaseSeconds).toBe(5);
    expect(ratelimit.rateLimitConfig.auth.backoffMaxSeconds).toBe(50);
    expect(ratelimit.rateLimitConfig.public.perIpPerMinute).toBe(11);
    expect(ratelimit.rateLimitConfig.authed.perIpPerMinute).toBe(99);
    expect(ratelimit.rateLimitConfig.authed.perUserPerMinute).toBe(88);
    expect(ratelimit.isRateLimitConfigured()).toBe(true);
  });
});

describe("rateLimitConfig — safe defaults with invalid-value fallback", () => {
  let ratelimit: typeof import("@/lib/ratelimit");

  beforeAll(async () => {
    ratelimit = await loadRatelimit({
      UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
      RATE_LIMIT_AUTH_BACKOFF_BASE_SECONDS: "not-a-number",
      RATE_LIMIT_PUBLIC_PER_IP_PER_MIN: "-3",
      RATE_LIMIT_AUTHED_USER_PER_MIN: "",
    });
  });

  it("falls back to documented defaults for unset or invalid values", () => {
    expect(ratelimit.rateLimitConfig.auth.attemptPerIpPerMinute).toBe(20);
    expect(ratelimit.rateLimitConfig.auth.backoffBaseSeconds).toBe(30); // invalid -> default
    expect(ratelimit.rateLimitConfig.auth.backoffMaxSeconds).toBe(1800);
    expect(ratelimit.rateLimitConfig.public.perIpPerMinute).toBe(30); // negative -> default
    expect(ratelimit.rateLimitConfig.authed.perIpPerMinute).toBe(2000);
    expect(ratelimit.rateLimitConfig.authed.perUserPerMinute).toBe(1200); // empty -> default
  });
});

// ── Unconfigured fail-closed contract ────────────────────────────────────

describe("tier checks — unconfigured fail-closed contract", () => {
  let ratelimit: typeof import("@/lib/ratelimit");

  beforeAll(async () => {
    ratelimit = await loadRatelimit({});
  });

  it("denies every tier check in production when Upstash is missing", async () => {
    setNodeEnv("production");
    expect(ratelimit.isRateLimitConfigured()).toBe(false);
    for (const check of [
      await ratelimit.checkAuthRouteLimit("1.1.1.1"),
      await ratelimit.checkPublicIpLimit("1.1.1.1"),
      await ratelimit.checkAuthedIpLimit("1.1.1.1"),
      await ratelimit.checkAuthedUserLimit("user-1"),
    ]) {
      expect(check.allowed).toBe(false);
      expect(check.limit).toBe(0);
      expect(check.remaining).toBe(0);
    }
  });

  it("stays permissive in development so local work is not blocked", async () => {
    setNodeEnv("development");
    const check = await ratelimit.checkAuthRouteLimit("1.1.1.1");
    expect(check.allowed).toBe(true);
    expect(check.remaining).toBe(Number.MAX_SAFE_INTEGER);
  });
});

// ── Auth tier: exponential backoff ───────────────────────────────────────

describe("checkAuthRouteLimit — per-IP window + exponential backoff", () => {
  let ratelimit: typeof import("@/lib/ratelimit");

  const IP = "203.0.113.9";
  const cooldownKey = `ratelimit:auth:cooldown:${IP}`;
  const violationsKey = `ratelimit:auth:violations:${IP}`;

  beforeAll(async () => {
    ratelimit = await loadRatelimit({
      UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
      RATE_LIMIT_AUTH_ATTEMPT_PER_IP_PER_MIN: "5",
      RATE_LIMIT_AUTH_BACKOFF_BASE_SECONDS: "10",
      RATE_LIMIT_AUTH_BACKOFF_MAX_SECONDS: "80",
    });
    // Prime the lazy limiter so beforeEach can control it.
    await ratelimit.checkAuthRouteLimit(IP);
  });

  const authLimiter = () => limiterByPrefix("ratelimit:auth:attempt");
  const failWindow = () =>
    authLimiter().limit.mockImplementation(async () => ({ success: false, remaining: 0, reset: 0 }));
  const passWindow = () =>
    authLimiter().limit.mockImplementation(async () => ({ success: true, remaining: 4, reset: 0 }));
  /** Force the cooldown key to expire so the next call hits the window again. */
  const expireCooldown = () => {
    const cur = redisStore().get(cooldownKey);
    if (cur) cur.expiresAt = 1;
  };

  beforeEach(() => {
    redisStore().clear();
    authLimiter().limit.mockClear();
    passWindow();
  });

  it("allows requests within the per-IP window", async () => {
    const check = await ratelimit.checkAuthRouteLimit(IP);
    expect(check.allowed).toBe(true);
    expect(check.limit).toBe(5);
    expect(check.remaining).toBe(4);
    expect(check.retryAfterSeconds).toBeUndefined();
  });

  it("rejects with the base cooldown on the first window violation", async () => {
    failWindow();
    const check = await ratelimit.checkAuthRouteLimit(IP);
    expect(check.allowed).toBe(false);
    expect(check.remaining).toBe(0);
    expect(check.retryAfterSeconds).toBe(10); // base, not a hard lockout
    expect(redisStore().get(violationsKey)?.value).toBe(1);
    expect(redisStore().get(cooldownKey)).toBeDefined();
  });

  it("active cooldown reports the computed backoff, not the cap (regression: ex was max)", async () => {
    failWindow();
    await ratelimit.checkAuthRouteLimit(IP); // first violation -> base 10s cooldown
    // Without forcing expiry, the live cooldown key must reflect 10s (base),
    // NOT the 80s cap — otherwise a first violation would hard-lock the IP.
    const check = await ratelimit.checkAuthRouteLimit(IP);
    expect(check.allowed).toBe(false);
    expect(check.retryAfterSeconds).toBeGreaterThan(0);
    expect(check.retryAfterSeconds).toBeLessThanOrEqual(10);
    // The violation counter was NOT incremented by this short-circuited call.
    expect(redisStore().get(violationsKey)?.value).toBe(1);
  });

  it("doubles the cooldown on each consecutive violation", async () => {
    failWindow();
    const sequence: Array<number | undefined> = [];
    for (let i = 0; i < 4; i++) {
      const check = await ratelimit.checkAuthRouteLimit(IP);
      sequence.push(check.retryAfterSeconds);
      expireCooldown(); // let the cooldown lapse so the next attempt hits the window
    }
    expect(sequence).toEqual([10, 20, 40, 80]); // base * 2^(n-1)
    expect(redisStore().get(violationsKey)?.value).toBe(4);
  });

  it("caps the cooldown at the configured maximum (no unbounded growth)", async () => {
    failWindow();
    for (let i = 0; i < 7; i++) {
      await ratelimit.checkAuthRouteLimit(IP);
      expireCooldown();
    }
    const check = await ratelimit.checkAuthRouteLimit(IP);
    expect(check.retryAfterSeconds).toBe(80); // capped, not 10 * 2^7
  });

  it("rejects immediately with the remaining TTL while a cooldown is active", async () => {
    failWindow();
    await ratelimit.checkAuthRouteLimit(IP); // establishes a cooldown
    const cur = redisStore().get(cooldownKey);
    if (!cur) throw new Error("expected a cooldown after the first violation");
    cur.expiresAt = Date.now() + 100_000; // deterministic TTL
    const check = await ratelimit.checkAuthRouteLimit(IP);
    expect(check.allowed).toBe(false);
    expect(check.remaining).toBe(0);
    expect(check.retryAfterSeconds).toBeGreaterThanOrEqual(99);
    expect(check.retryAfterSeconds).toBeLessThanOrEqual(100);
    // Short-circuited before the window check: no additional violation counted.
    expect(redisStore().get(violationsKey)?.value).toBe(1);
  });

  it("clears the violation counter once the IP is back under the window", async () => {
    failWindow();
    await ratelimit.checkAuthRouteLimit(IP);
    expireCooldown();
    await ratelimit.checkAuthRouteLimit(IP); // second violation
    expect(redisStore().get(violationsKey)?.value).toBe(2);

    passWindow();
    expireCooldown();
    const check = await ratelimit.checkAuthRouteLimit(IP);
    expect(check.allowed).toBe(true);
    expect(redisStore().has(violationsKey)).toBe(false); // backoff fully reset
  });
});

// ── Public tier ──────────────────────────────────────────────────────────

describe("checkPublicIpLimit — moderate per-IP ceiling", () => {
  let ratelimit: typeof import("@/lib/ratelimit");

  beforeAll(async () => {
    ratelimit = await loadRatelimit({
      UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
      RATE_LIMIT_PUBLIC_PER_IP_PER_MIN: "11",
    });
    await ratelimit.checkPublicIpLimit("8.8.8.8"); // prime the lazy limiter
  });

  it("allows under the ceiling with remaining budget", async () => {
    const check = await ratelimit.checkPublicIpLimit("8.8.8.8");
    expect(check.allowed).toBe(true);
    expect(check.limit).toBe(11);
    expect(check.remaining).toBe(999);
  });

  it("rejects once the per-IP ceiling is hit", async () => {
    limiterByPrefix("ratelimit:public:ip").limit.mockImplementation(async () => ({
      success: false,
      remaining: 0,
      reset: 0,
    }));
    const check = await ratelimit.checkPublicIpLimit("8.8.8.8");
    expect(check.allowed).toBe(false);
    expect(check.limit).toBe(11);
  });
});

// ── Authed tier ──────────────────────────────────────────────────────────

describe("authed tier — loose per-IP and per-user ceilings", () => {
  let ratelimit: typeof import("@/lib/ratelimit");

  beforeAll(async () => {
    ratelimit = await loadRatelimit({
      UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
      RATE_LIMIT_AUTHED_IP_PER_MIN: "99",
      RATE_LIMIT_AUTHED_USER_PER_MIN: "88",
    });
    await ratelimit.checkAuthedIpLimit("8.8.8.8"); // prime the lazy limiters
    await ratelimit.checkAuthedUserLimit("user-1");
  });

  it("allows authenticated requests under both ceilings", async () => {
    const byIp = await ratelimit.checkAuthedIpLimit("8.8.8.8");
    const byUser = await ratelimit.checkAuthedUserLimit("user-1");
    expect(byIp.allowed).toBe(true);
    expect(byIp.limit).toBe(99);
    expect(byUser.allowed).toBe(true);
    expect(byUser.limit).toBe(88);
  });

  it("rejects an IP that exceeds the authenticated ceiling", async () => {
    limiterByPrefix("ratelimit:authed:ip").limit.mockImplementation(async () => ({
      success: false,
      remaining: 0,
      reset: 0,
    }));
    const check = await ratelimit.checkAuthedIpLimit("8.8.8.8");
    expect(check.allowed).toBe(false);
    expect(check.limit).toBe(99);
  });

  it("rejects a user that exceeds the per-user ceiling", async () => {
    limiterByPrefix("ratelimit:authed:user").limit.mockImplementation(async () => ({
      success: false,
      remaining: 0,
      reset: 0,
    }));
    const check = await ratelimit.checkAuthedUserLimit("user-1");
    expect(check.allowed).toBe(false);
    expect(check.limit).toBe(88);
  });
});

// ── Plan budgets (per-user AI message quotas) ────────────────────────────

describe("checkMessageLimit — free/pro plan budgets", () => {
  let ratelimit: typeof import("@/lib/ratelimit");

  beforeAll(async () => {
    ratelimit = await loadRatelimit({
      UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
    });
  });

  it("allows free-plan messages within hourly and daily budgets", async () => {
    const check = await ratelimit.checkMessageLimit("user-1", "free");
    expect(check.allowed).toBe(true);
    expect(check.limit).toBe(50); // freeDaily default
    expect(check.window).toBe("day");
  });

  it("applies the pro hourly budget", async () => {
    const check = await ratelimit.checkMessageLimit("user-1", "pro");
    expect(check.allowed).toBe(true);
    expect(check.limit).toBe(100); // proHourly default
    expect(check.window).toBe("hour");
  });
});
