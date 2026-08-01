import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getPlanConfig } from "@/config/plans";
import { modelRegistry } from "@/services/ModelRegistry";
import { capabilities } from "@/lib/capabilities";
import { providerHealthService } from "@/services/ProviderHealthService";
import { logger } from "@/lib/logger";
import type { RouteOptions, ProviderConfig, ProviderResult } from "./types";
import type { ModelEntry } from "@/config/models";

const TIMEOUT_MS = 60000;

const PROVIDERS: ProviderConfig[] = [
  { id: "groq-llama3-70b", name: "Llama 3.1 70B", provider: "groq", model: "llama-3.1-70b-versatile", temperature: 0.7, isFree: true },
  { id: "groq-mixtral-8x7b", name: "Mixtral 8x7B", provider: "groq", model: "mixtral-8x7b-32768", temperature: 0.7, isFree: true },
  { id: "gemini-flash", name: "Gemini 1.5 Flash", provider: "google", model: "gemini-1.5-flash", temperature: 0.7, isFree: true },
  { id: "gemini-pro", name: "Gemini 1.5 Pro", provider: "google", model: "gemini-1.5-pro", temperature: 0.7, isFree: false },
  { id: "openrouter-claude", name: "Claude 3.5 Sonnet", provider: "openrouter", model: "anthropic/claude-3.5-sonnet", temperature: 0.7, isFree: false },
  { id: "openrouter-gpt4", name: "GPT-4o", provider: "openrouter", model: "openai/gpt-4o", temperature: 0.7, isFree: false },
];

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

export interface RouterOptions extends RouteOptions {
  isPro?: boolean;
}

export class ProviderRouter {
  async route(options: RouterOptions): Promise<ProviderResult> {
    const startTime = Date.now();
    const queue = this.resolveQueue(options);
    let lastError: Error | null = null;

    for (const config of queue) {
      try {
        const client = getClient(config.provider);
        const model = client(config.model);

        const result = await streamText({
          model,
          system: options.system,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: options.messages as any,
          temperature: config.temperature,
          abortSignal: AbortSignal.timeout(TIMEOUT_MS),
        });

        let content = "";
        for await (const chunk of result.textStream) {
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
        logger.warn(`[ProviderRouter] ${config.provider}/${config.model} failed`, {
          error: error instanceof Error ? error.message : String(error),
        });
        if (this.isRetryable(error)) continue;
        throw error;
      }
    }

    throw lastError || new Error("All providers exhausted");
  }

  async *stream(options: RouterOptions): AsyncGenerator<ProviderResult> {
    const startTime = Date.now();
    const queue = this.resolveQueue(options);
    let lastError: Error | null = null;

    for (const config of queue) {
      try {
        const client = getClient(config.provider);
        const model = client(config.model);

        const result = await streamText({
          model,
          system: options.system,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: options.messages as any,
          temperature: config.temperature,
          abortSignal: AbortSignal.timeout(TIMEOUT_MS),
        });

        for await (const chunk of result.textStream) {
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
        lastError = error as Error;
        logger.warn(`[ProviderRouter] ${config.provider}/${config.model} failed`, {
          error: error instanceof Error ? error.message : String(error),
        });
        if (this.isRetryable(error)) continue;
        throw error;
      }
    }

    throw lastError || new Error("All providers exhausted");
  }

  private resolveQueue(options: RouterOptions): ProviderConfig[] {
    const { modelId, plan, isPro, intent, capabilityContext } = options;

    // Backward compat: isPro path (no plan)
    if (!plan) {
      if (modelId && modelId !== "auto") {
        const found = PROVIDERS.find((p) => p.id === modelId);
        if (found) return [found];
      }
      return isPro ? PROVIDERS : PROVIDERS.filter((p) => p.isFree);
    }

    const planConfig = getPlanConfig(plan);

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
        msg.includes("timeout")
      );
    }
    return false;
  }
}

export const providerRouter = new ProviderRouter();
