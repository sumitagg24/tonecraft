import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";

// NODE_ENV is read-only in @types/node; tests flip it through this cast.
const setNodeEnv = (value: string | undefined) => {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
};

// --- Mocks -------------------------------------------------------------
// The cache module reads env at import time and constructs `new Redis(...)`,
// so we substitute a tiny in-memory store. `jest.resetModules()` + dynamic
// import lets each describe get a fresh module instance (configured vs not).

jest.mock("@upstash/redis", () => {
  const store = new Map<string, unknown>();
  return {
    Redis: jest.fn().mockImplementation(() => ({
      get: jest.fn(async (key: string) => (store.has(key) ? store.get(key) : null)),
      set: jest.fn(async (key: string, value: unknown) => {
        store.set(key, value);
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key);
      }),
    })),
  };
});

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/error-reporting", () => ({
  reportError: jest.fn(),
}));

const REAL_URL = process.env.UPSTASH_REDIS_REST_URL;
const REAL_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REAL_NODE_ENV = process.env.NODE_ENV;afterAll(() => {
  if (REAL_URL === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
  else process.env.UPSTASH_REDIS_REST_URL = REAL_URL;
  if (REAL_TOKEN === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
  else process.env.UPSTASH_REDIS_REST_TOKEN = REAL_TOKEN;
  setNodeEnv(REAL_NODE_ENV);
});

// --- Cache: fail-open when Redis is not configured ----------------------

describe("cache — fail-open without Redis", () => {
  let cache: typeof import("@/lib/cache");

  beforeAll(async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    jest.resetModules();
    cache = await import("@/lib/cache");
  });

  it("returns null from cacheGet (cache miss, never throws)", async () => {
    await expect(cache.cacheGet("anything")).resolves.toBeNull();
  });

  it("cacheSet is a no-op", async () => {
    await expect(cache.cacheSet("k", { a: 1 }, 60)).resolves.toBeUndefined();
  });

  it("cacheWrap falls back to the loader", async () => {
    const loader = jest.fn(async () => ({ fresh: true }));
    const value = await cache.cacheWrap("plan:user-1", 300, loader);
    expect(value).toEqual({ fresh: true });
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

// --- Cache: read-through with Redis configured --------------------------

describe("cache — read-through with Redis", () => {
  let cache: typeof import("@/lib/cache");

  beforeAll(async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    jest.resetModules();
    cache = await import("@/lib/cache");
  });

  it("round-trips a value through cacheSet/cacheGet", async () => {
    const value = { tier: "pro", limits: { daily: 100 } };
    await cache.cacheSet("plan:user-1", value, 60);
    await expect(cache.cacheGet("plan:user-1")).resolves.toEqual(value);
  });

  it("cacheWrap calls the loader once, then serves from cache", async () => {
    const loader = jest.fn(async () => "cached-value");
    const first = await cache.cacheWrap("key-1", 60, loader);
    const second = await cache.cacheWrap("key-1", 60, loader);
    expect(first).toBe("cached-value");
    expect(second).toBe("cached-value");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("never caches a rejected loader", async () => {
    const loader = jest.fn<() => Promise<string>>(async () => {
      throw new Error("loader failed");
    });
    await expect(cache.cacheWrap("key-fail", 60, loader)).rejects.toThrow("loader failed");
    // A later call runs the loader again (nothing was stored from the failure),
    // and a now-succeeding result is returned — not a stale cached value.
    loader.mockImplementationOnce(async () => "recovered");
    await expect(cache.cacheWrap("key-fail", 60, loader)).resolves.toBe("recovered");
    expect(loader).toHaveBeenCalledTimes(2);
  });
});

// --- Rate limiting: unconfigured fail-closed contract -------------------

describe("ratelimit — unconfigured fail-closed contract", () => {
  let ratelimit: typeof import("@/lib/ratelimit");

  beforeAll(async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    jest.resetModules();
    ratelimit = await import("@/lib/ratelimit");
  });

  it("fails closed in production (denies when Upstash is missing)", async () => {
    setNodeEnv("production");
    const check = await ratelimit.checkMessageLimit("user-1", "free");
    expect(check.allowed).toBe(false);
    expect(check.limit).toBe(0);
    expect(check.remaining).toBe(0);
  });

  it("allows in development (permissive fallback so local work is not blocked)", async () => {
    setNodeEnv("development");
    const check = await ratelimit.checkMessageLimit("user-1", "free");
    expect(check.allowed).toBe(true);
    expect(check.limit).toBe(Number.MAX_SAFE_INTEGER);
  });
});
