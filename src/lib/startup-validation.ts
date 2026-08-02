import { getAllModels } from "@/config/models";

/**
 * Startup configuration validation (audit 12 P0.8).
 *
 * - Production runtime (server): MISSING critical env vars throw at boot
 *   (fail fast). Critical = database, auth, rate limiting, storage.
 * - Development / client bundle / `next build`: warnings only, never throws.
 *
 * Guards:
 *  - `typeof window === "undefined"` — this module is imported by the root
 *    layout (client bundle too), where process.env is empty; never throw there.
 *  - `NEXT_PHASE !== "phase-production-build"` — `next build` sets NODE_ENV to
 *    production and may run without a .env; builds must not fail on env checks.
 */

const CRITICAL_ENV_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "CLERK_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
] as const;

function getMissingCritical(): string[] {
  return CRITICAL_ENV_KEYS.filter((k) => !process.env[k]);
}

function getMissingLLMKeys(): string[] {
  const keys = ["GROQ_API_KEY", "OPENROUTER_API_KEY", "GOOGLE_AI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"];
  return keys.filter((k) => !process.env[k]);
}

/** Mirrors the ratelimit module's configured check without importing it (client-bundle safe). */
function isRateLimitConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN &&
      process.env.UPSTASH_REDIS_REST_URL !== "https://..."
  );
}

export function validateConfig(): string[] {
  const warnings: string[] = [];

  const missingLLM = getMissingLLMKeys();
  if (missingLLM.length === 5) {
    warnings.push("No LLM API keys configured. Set at least one in .env");
  } else if (missingLLM.length > 0) {
    warnings.push(`LLM providers without a key: ${missingLLM.join(", ")}`);
  }

  if (!isRateLimitConfigured()) {
    warnings.push("Rate limiting is not configured — requests fail closed in production.");
  }

  const models = getAllModels();
  const deprecatedModels = models.filter((m) => m.status === "deprecated");
  if (deprecatedModels.length > 0) {
    warnings.push(`Deprecated models in config: ${deprecatedModels.map((m) => m.id).join(", ")}. These will not be used.`);
  }

  const duplicateIds = models.filter((m, i, a) => a.findIndex((x) => x.id === m.id) !== i);
  if (duplicateIds.length > 0) {
    warnings.push(`Duplicate model IDs: ${duplicateIds.map((m) => m.id).join(", ")}`);
  }

  return warnings;
}

// Server-only, outside `next build`, production runtime:
const isServer = typeof window === "undefined";
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (isServer && !isBuildPhase && process.env.NODE_ENV === "production") {
  const missingCritical = getMissingCritical();
  if (missingCritical.length > 0) {
    const message = `[startup-validation] Missing required env vars: ${missingCritical.join(", ")}. Refusing to boot.`;
    console.error(message);
    throw new Error(message);
  }
}

if (isServer) {
  const missingCritical = getMissingCritical();
  if (missingCritical.length > 0) {
    console.warn(`[startup-validation] Missing env vars (will be fatal in production): ${missingCritical.join(", ")}`);
  }

  const warnings = validateConfig();
  if (warnings.length > 0) {
    console.warn("\n⚠️  Configuration Warnings:");
    warnings.forEach((w) => console.warn(`  • ${w}`));
    console.warn("");
  }
}
