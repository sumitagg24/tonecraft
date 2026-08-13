import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { Redis } from "@upstash/redis";
import type { ProviderName } from "@/config/models";

export type ProviderStatus = "healthy" | "degraded" | "offline";

export interface HealthDetail {
  name: string;
  status: ProviderStatus;
  lastChecked: Date;
  latencyMs?: number;
  error?: string;
}

export interface HealthReport {
  status: ProviderStatus;
  providers: Record<string, HealthDetail>;
  checkedAt: Date;
}

const HEALTH_CHECK_TIMEOUT_MS = 5_000;
const CACHE_TTL_MS = 30_000;

interface HttpProviderConfig {
  name: string;
  envVar: string;
  url: string;
  authType: "bearer" | "query";
  queryKey?: string;
}

const HTTP_PROVIDERS: HttpProviderConfig[] = [
  {
    name: "groq",
    envVar: "GROQ_API_KEY",
    url: "https://api.groq.com/openai/v1/models",
    authType: "bearer",
  },
  {
    name: "gemini",
    envVar: "GOOGLE_AI_API_KEY",
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    authType: "query",
    queryKey: "key",
  },
  {
    name: "openrouter",
    envVar: "OPENROUTER_API_KEY",
    url: "https://openrouter.ai/api/v1/models",
    authType: "bearer",
  },
  {
    name: "clerk",
    envVar: "CLERK_SECRET_KEY",
    url: "https://api.clerk.com/v1/users?limit=1",
    authType: "bearer",
  },
  {
    name: "paddle",
    envVar: "PADDLE_API_KEY",
    url: "https://api.paddle.com/2.0/products",
    authType: "bearer",
  },
];

const AI_PROVIDER_MAP: Record<string, ProviderName> = {
  groq: "groq",
  gemini: "google",
  openrouter: "openrouter",
};

function classifyHttpStatus(status: number): ProviderStatus {
  if (status >= 200 && status < 300) return "healthy";
  if (status === 401 || status === 403) return "offline";
  if (status >= 500) return "degraded";
  return "degraded";
}

function classifyError(error: unknown): ProviderStatus {
  const msg = String(error instanceof Error ? error.message : error).toLowerCase();
  if (msg.includes("timeout") || msg.includes("timed out")) return "degraded";
  if (
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("unauthorized") ||
    msg.includes("forbidden")
  )
    return "offline";
  return "degraded";
}

async function fetchWithTimeout(
  url: string,
  opts: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

class ProviderHealthService {
  private cache = new Map<string, HealthDetail>();
  private lastCheck = new Map<string, number>();

  async checkAll(force = false): Promise<HealthReport> {
    const checks = [
      this.checkDatabase(force),
      this.checkRedis(force),
      this.checkHttpProvider(HTTP_PROVIDERS[0], force),
      this.checkHttpProvider(HTTP_PROVIDERS[1], force),
      this.checkHttpProvider(HTTP_PROVIDERS[2], force),
      this.checkHttpProvider(HTTP_PROVIDERS[3], force),
      this.checkHttpProvider(HTTP_PROVIDERS[4], force),
    ];

    const results = await Promise.all(checks);

    const providers: Record<string, HealthDetail> = {};
    for (const detail of results) {
      providers[detail.name] = detail;
    }

    const offlineCount = results.filter((p) => p.status === "offline").length;
    const degradedCount = results.filter((p) => p.status === "degraded").length;

    let overall: ProviderStatus;
    if (offlineCount > 0) overall = "offline";
    else if (degradedCount > 0) overall = "degraded";
    else overall = "healthy";

    return { status: overall, providers, checkedAt: new Date() };
  }

  private isCacheFresh(name: string, force: boolean): boolean {
    if (force) return false;
    const last = this.lastCheck.get(name);
    return last !== undefined && Date.now() - last < CACHE_TTL_MS;
  }

  private setCache(detail: HealthDetail): HealthDetail {
    this.cache.set(detail.name, detail);
    this.lastCheck.set(detail.name, Date.now());
    return detail;
  }

  private getCached(name: string): HealthDetail | undefined {
    return this.cache.get(name);
  }

  async checkDatabase(force = false): Promise<HealthDetail> {
    const name = "database";
    const detail = this.getCached(name);
    if (detail && this.isCacheFresh(name, force)) {
      return detail;
    }

    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      return this.setCache({ name, status: "healthy", lastChecked: new Date(), latencyMs: latency });
    } catch (error) {
      const latency = Date.now() - start;
      const status = classifyError(error);
      logger.error("Database health check failed", { error: String(error) });
      return this.setCache({
        name,
        status,
        lastChecked: new Date(),
        latencyMs: latency,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /** Phase 12.3 — Redis (Upstash) reachability via a ping round-trip. */
  async checkRedis(force = false): Promise<HealthDetail> {
    const name = "redis";
    const detail = this.getCached(name);
    if (detail && this.isCacheFresh(name, force)) return detail;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      return this.setCache({
        name,
        status: "degraded",
        lastChecked: new Date(),
        error: "UPSTASH_REDIS_REST_URL/TOKEN not configured",
      });
    }

    const start = Date.now();
    try {
      const redis = new Redis({ url, token });
      const pong = await Promise.race([
        redis.ping(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), HEALTH_CHECK_TIMEOUT_MS)
        ),
      ]);
      const latency = Date.now() - start;
      if (pong !== "PONG" && pong !== "pong") {
        return this.setCache({ name, status: "degraded", lastChecked: new Date(), latencyMs: latency, error: "Unexpected ping response" });
      }
      return this.setCache({ name, status: "healthy", lastChecked: new Date(), latencyMs: latency });
    } catch (error) {
      const latency = Date.now() - start;
      return this.setCache({
        name,
        status: classifyError(error),
        lastChecked: new Date(),
        latencyMs: latency,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async checkHttpProvider(config: HttpProviderConfig, force = false): Promise<HealthDetail> {
    const name = config.name;
    const detail = this.getCached(name);
    if (detail && this.isCacheFresh(name, force)) {
      return detail;
    }

    const start = Date.now();
    const apiKey = process.env[config.envVar];

    if (!apiKey) {
      return this.setCache({
        name,
        status: "offline",
        lastChecked: new Date(),
        error: `Missing ${config.envVar} environment variable`,
      });
    }

    let url = config.url;
    // Paddle has separate live/sandbox hosts — hit the one matching the key
    // (sandbox keys start with `pdl_sdbx_`), otherwise the probe always fails.
    if (config.name === "paddle") {
      const isSandbox = apiKey.startsWith("pdl_sdbx_");
      const base = isSandbox ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
      // Paddle Billing API (v1 of the current API) — the legacy `/2.0/` paths 404.
      url = `${base}/products`;
    }
    const urlObj = new URL(url);
    if (config.authType === "query" && config.queryKey) {
      urlObj.searchParams.set(config.queryKey, apiKey);
    }

    try {
      const response = await fetchWithTimeout(
        urlObj.toString(),
        {
          headers: config.authType === "bearer" ? { Authorization: `Bearer ${apiKey}` } : {},
        },
        HEALTH_CHECK_TIMEOUT_MS,
      );

      const status = classifyHttpStatus(response.status);
      const latency = Date.now() - start;

      if (response.ok) {
        return this.setCache({ name, status, lastChecked: new Date(), latencyMs: latency });
      }

      const errorText = (await response.text()).slice(0, 200);
      return this.setCache({
        name,
        status,
        lastChecked: new Date(),
        latencyMs: latency,
        error: `HTTP ${response.status}: ${errorText}`,
      });
    } catch (error) {
      const latency = Date.now() - start;
      const status = classifyError(error);
      return this.setCache({
        name,
        status,
        lastChecked: new Date(),
        latencyMs: latency,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async checkGroq(force = false): Promise<HealthDetail> {
    return this.checkHttpProvider(HTTP_PROVIDERS[0], force);
  }

  async checkGemini(force = false): Promise<HealthDetail> {
    return this.checkHttpProvider(HTTP_PROVIDERS[1], force);
  }

  async checkOpenRouter(force = false): Promise<HealthDetail> {
    return this.checkHttpProvider(HTTP_PROVIDERS[2], force);
  }

  async checkClerk(force = false): Promise<HealthDetail> {
    return this.checkHttpProvider(HTTP_PROVIDERS[3], force);
  }

  async checkPaddle(force = false): Promise<HealthDetail> {
    return this.checkHttpProvider(HTTP_PROVIDERS[4], force);
  }

  async refresh(): Promise<HealthReport> {
    return this.checkAll(true);
  }

  getStatus(name: string): HealthDetail | undefined {
    return this.cache.get(name);
  }

  isProviderUsable(provider: ProviderName): boolean {
    const aiName = Object.keys(AI_PROVIDER_MAP).find((k) => AI_PROVIDER_MAP[k] === provider);
    if (!aiName) return true;
    const detail = this.cache.get(aiName);
    if (!detail) return true;
    return detail.status !== "offline";
  }
}

export const providerHealthService = new ProviderHealthService();
