import { streamText, type FlexibleSchema, type ToolSet } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { PlanTier, getPlanConfig } from "@/config/plans";
import { modelRegistry } from "@/services/ModelRegistry";
import { capabilities } from "@/lib/capabilities";
import { providerHealthService } from "@/services/ProviderHealthService";
import { checkProviderLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import type { RouteOptions, ProviderConfig, ProviderResult } from "./types";
import type { ModelEntry } from "@/config/models";

// Idle timeout: abort only when no chunk arrives for this long, so a slow but
// progressing stream is never killed by a wall-clock cap (audit A3).
const IDLE_TIMEOUT_MS = 60000;

// Phase 12.6 — retry the same provider before failing over to the next one.
const PROVIDER_RETRIES = 3; // attempts per provider (1 initial + 2 retries)
const RETRY_BASE_DELAY_MS = 300; // exponential backoff base

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Thrown when the per-user per-provider budget is exhausted (Phase 12.4).
 * Distinct class so the failover loop can recognize it without relying on
 * error-message substring matching.
 */
export class ProviderRateLimitedError extends Error {
  provider: string;

  constructor(provider: string) {
    super(`Provider ${provider} rate limit exceeded`);
    this.name = "ProviderRateLimitedError";
    this.provider = provider;
  }
}

/** Per-provider budget gate — throws ProviderRateLimitedError when exhausted. */
async function assertProviderBudget(config: ProviderConfig, userId?: string): Promise<void> {
  if (!userId) return;
  const rl = await checkProviderLimit(config.provider, `${config.provider}:${userId}`);
  if (!rl.allowed) {
    logger.warn(`[ProviderRouter] ${config.provider} rate-limited for user, failing over`, { userId });
    throw new ProviderRateLimitedError(config.provider);
  }
}

function getClient(provider: string) {
  switch (provider) {
    case "groq":
      return createGroq({ apiKey: process.env.GROQ_API_KEY });
    case "openrouter":
      return createOpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: "https://openrouter.ai/api/v1" });
    case "google":
      return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
    case "openai":
      return createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export class ProviderRouter {
  async route(options: RouteOptions): Promise<ProviderResult> {
    const startTime = Date.now();
    const queue = this.resolveQueue(options);
    let lastError: Error | null = null;

    for (const config of queue) {
      const idle = createIdleAbort(options.signal, IDLE_TIMEOUT_MS);
      try {
        // Phase 12.6 — retry the same provider (exponential backoff) before
        // failing over to the next provider in the queue.
        const result = await this.attemptWithRetries(config, options, idle, startTime);
        return result;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`[ProviderRouter] ${config.provider}/${config.model} exhausted`, {
          error: error instanceof Error ? error.message : String(error),
        });
        // Budget exhaustion is a deliberate fail-over, not a transient error.
        if (error instanceof ProviderRateLimitedError || this.isRetryable(error)) continue;
        throw error;
      } finally {
        idle.cleanup();
      }
    }

    throw lastError || new Error("All providers exhausted");
  }

  async *stream(options: RouteOptions): AsyncGenerator<ProviderResult> {
    const startTime = Date.now();
    const queue = this.resolveQueue(options);
    let lastError: Error | null = null;

    for (const config of queue) {
      const idle = createIdleAbort(options.signal, IDLE_TIMEOUT_MS);
      try {
        // Phase 12.6 — retry the same provider (with backoff) while the stream
        // is still starting up; once tokens have been emitted we can no longer
        // safely retry, so failures after the first chunk fail over instead.
        const stream = this.attemptStreamWithRetries(config, options, idle, startTime);
        for await (const chunk of stream) {
          yield chunk;
        }
        return;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`[ProviderRouter] ${config.provider}/${config.model} exhausted`, {
          error: error instanceof Error ? error.message : String(error),
        });
        // Budget exhaustion is a deliberate fail-over, not a transient error.
        if (error instanceof ProviderRateLimitedError || this.isRetryable(error)) continue;
        throw error;
      } finally {
        idle.cleanup();
      }
    }

    throw lastError || new Error("All providers exhausted");
  }

  /**
   * Phase 12.6 — streaming variant. Retries the provider with backoff only
   * until the first chunk is emitted (a partial response can't be replayed);
   * mid-stream failures propagate to the caller's failover loop.
   */
  private async *attemptStreamWithRetries(
    config: ProviderConfig,
    options: RouteOptions,
    idle: { signal: AbortSignal; reset: () => void; cleanup: () => void },
    startTime: number
  ): AsyncGenerator<ProviderResult> {
    let lastError: Error | null = null;

    // Phase 12.4 — check the per-provider budget once per provider, not per
    // retry attempt (each check consumes a token from the sliding window).
    await assertProviderBudget(config, options.userId);

    for (let attempt = 0; attempt < PROVIDER_RETRIES; attempt++) {
      try {
        const client = getClient(config.provider);
        const model = client(config.model);

        const result = await streamText({
          model,
          system: options.system,
          messages: options.messages,
          temperature: config.temperature,
          abortSignal: idle.signal,
          ...(options.tools?.length ? { tools: toSDKTools(options.tools) } : {}),
        });

        for await (const chunk of result.textStream) {
          idle.reset();
          yield { content: chunk, model: config.id, provider: config.provider, tokens: 0, latency: 0 };
        }

        const usage = await result.usage;
        yield {
          content: "",
          model: config.id,
          provider: config.provider,
          tokens: usage?.totalTokens ?? 0,
          latency: Date.now() - startTime,
          finishReason: "__done__",
        };
        return;
      } catch (error) {
        // Once a chunk has been delivered we can't retry — rethrow so the
        // outer failover loop decides (next provider or abort).
        if (this.isRetryable(error) && attempt < PROVIDER_RETRIES - 1) {
          lastError = error as Error;
          logger.warn(`[ProviderRouter] ${config.provider}/${config.model} stream attempt ${attempt + 1}/${PROVIDER_RETRIES} failed`, {
            error: error instanceof Error ? error.message : String(error),
          });
          await delay(RETRY_BASE_DELAY_MS * 2 ** attempt);
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error("Provider stream retries exhausted");
  }

  /** Phase 12.6 — call one provider with retries and exponential backoff. */
  private async attemptWithRetries(
    config: ProviderConfig,
    options: RouteOptions,
    idle: { signal: AbortSignal; reset: () => void; cleanup: () => void },
    startTime: number
  ): Promise<ProviderResult> {
    let lastError: Error | null = null;

    // Phase 12.4 — check the per-provider budget once per provider, not per
    // retry attempt (each check consumes a token from the sliding window).
    await assertProviderBudget(config, options.userId);

    for (let attempt = 0; attempt < PROVIDER_RETRIES; attempt++) {
      try {
        const client = getClient(config.provider);
        const model = client(config.model);

        const result = await streamText({
          model,
          system: options.system,
          messages: options.messages,
          temperature: config.temperature,
          abortSignal: idle.signal,
          ...(options.tools?.length ? { tools: toSDKTools(options.tools) } : {}),
        });

        let content = "";
        for await (const chunk of result.textStream) {
          idle.reset();
          content += chunk;
        }

        const usage = await result.usage;

        return {
          content,
          model: config.id,
          provider: config.provider,
          tokens: usage?.totalTokens ?? 0,
          latency: Date.now() - startTime,
          finishReason: "stop",
        };
      } catch (error) {
        lastError = error as Error;
        const retryable = this.isRetryable(error);
        const lastAttempt = attempt === PROVIDER_RETRIES - 1;
        logger.warn(`[ProviderRouter] ${config.provider}/${config.model} attempt ${attempt + 1}/${PROVIDER_RETRIES} failed`, {
          error: error instanceof Error ? error.message : String(error),
          retryable,
        });
        if (!retryable || lastAttempt) throw error;
        await delay(RETRY_BASE_DELAY_MS * 2 ** attempt);
      }
    }

    throw lastError || new Error("Provider retries exhausted");
  }

  private resolveQueue(options: RouteOptions): ProviderConfig[] {
    const { modelId, plan, intent, capabilityContext } = options;

    // Single source of truth: config/models.ts + ModelRegistry. The legacy
    // hardcoded PROVIDERS array (with retired model IDs) has been removed.
    const planConfig = plan ? getPlanConfig(plan) : getPlanConfig(PlanTier.FREE);

    // Explicit model requested
    if (modelId && modelId !== "auto") {
      const entry = modelRegistry.getModelById(modelId);
      if (entry && modelRegistry.isAvailable(entry.id)) {
        const fallback = modelRegistry.resolveFallbackChain(planConfig, modelId);
        return this.toProviderConfigs([entry, ...fallback]);
      }
      return this.toProviderConfigs(modelRegistry.resolveFallbackChain(planConfig, modelId));
    }

    // Capability-based routing: prefer models matching the task's capability tier
    const allModels = modelRegistry.resolve(planConfig);

    if (intent) {
      const tier = capabilities.resolveCapabilityTier(intent, capabilityContext);
      const ranked = capabilities.rankByCapability(allModels, tier);
      return this.toProviderConfigs(ranked);
    }

    return this.toProviderConfigs([...allModels]);
  }

  private toProviderConfigs(entries: readonly ModelEntry[]): ProviderConfig[] {
    return entries
      .map((entry) => this.toProviderConfig(entry))
      .filter((config) => providerHealthService.isProviderUsable(config.provider));
  }

  private toProviderConfig(entry: ModelEntry): ProviderConfig {
    return {
      id: entry.id,
      name: entry.displayName,
      provider: entry.provider,
      model: entry.modelId,
      temperature: entry.temperature,
      isFree: entry.tier === "free",
      maxTokens: entry.maxTokens,
    };
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes("rate limit") ||
        msg.includes("too many requests") ||
        msg.includes("429") ||
        msg.includes("timeout") ||
        // 5xx / network errors should ride the failover queue too (audit A12)
        msg.includes("500") ||
        msg.includes("502") ||
        msg.includes("503") ||
        msg.includes("network") ||
        msg.includes("fetch failed") ||
        msg.includes("econnrefused")
      );
    }
    return false;
  }
}

export const providerRouter = new ProviderRouter();

/**
 * Abort controller that fires on an idle timeout (reset on each chunk) and is
 * also linked to an external signal (e.g. the HTTP request's abort) so a client
 * disconnect cancels the upstream provider call (audit A3).
 */
function createIdleAbort(external: AbortSignal | undefined, idleMs: number): { signal: AbortSignal; reset: () => void; cleanup: () => void } {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const onExternalAbort = () => {
    controller.abort();
  };

  if (external) {
    if (external.aborted) onExternalAbort();
    else external.addEventListener("abort", onExternalAbort, { once: true });
  }

  const arm = () => {
    timer = setTimeout(() => {
      controller.abort(new DOMException("Idle timeout", "TimeoutError"));
    }, idleMs);
  };
  arm();

  return {
    signal: controller.signal,
    reset: () => {
      if (timer) clearTimeout(timer);
      if (!controller.signal.aborted) arm();
    },
    cleanup: () => {
      if (timer) clearTimeout(timer);
      external?.removeEventListener("abort", onExternalAbort);
    },
  };
}

/** Maps the typed protocol (engine/tools.ts) to the AI SDK's ToolSet. */
function toSDKTools(tools: import("./tools").AITool[]): ToolSet {
  const sdk: ToolSet = {};
  for (const tool of tools) {
    sdk[tool.name] = {
      description: tool.description,
      // The app's ToolInputSchema is JSON Schema; the SDK accepts raw JSON
      // schemas in `inputSchema`, so only the loose structural type needs
      // narrowing at this boundary (no runtime conversion).
      inputSchema: tool.inputSchema as unknown as FlexibleSchema,
      execute: async (input: Record<string, unknown>) => tool.handler(input),
    };
  }
  return sdk;
}
