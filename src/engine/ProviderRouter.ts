import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { type PlanTier, getPlanConfig } from "@/config/plans";
import { modelRegistry } from "@/services/ModelRegistry";
import type { ProviderConfig, ProviderResult } from "./types";
import type { ModelEntry } from "@/config/models";

const TIMEOUT_MS = 60000;

// ponytail: PROVIDERS retained for backward compat with isPro path. Remove when isPro is removed in Phase 7.
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

export class ProviderRouter {
  async route(options: {
    system: string;
    messages: { role: "user" | "assistant" | "system"; content: string }[];
    modelId?: string;
    /** @deprecated Use plan instead. Remove in Phase 7. */
    isPro?: boolean;
    plan?: PlanTier;
  }): Promise<ProviderResult> {
    const { system, messages, modelId, isPro, plan } = options;
    const queue = this.resolveQueue(modelId, isPro, plan);
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (const config of queue) {
      try {
        const client = getClient(config.provider);
        const model = client(config.model);

        const result = await streamText({
          model,
          system,
          messages: messages as any,
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
        if (this.isRetryable(error)) continue;
        throw error;
      }
    }

    throw lastError || new Error("All providers exhausted");
  }

  async *stream(options: {
    system: string;
    messages: { role: "user" | "assistant" | "system"; content: string }[];
    modelId?: string;
    /** @deprecated Use plan instead. Remove in Phase 7. */
    isPro?: boolean;
    plan?: PlanTier;
  }): AsyncGenerator<ProviderResult> {
    const { system, messages, modelId, isPro, plan } = options;
    const queue = this.resolveQueue(modelId, isPro, plan);
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (const config of queue) {
      try {
        const client = getClient(config.provider);
        const model = client(config.model);

        const result = await streamText({
          model,
          system,
          messages: messages as any,
          temperature: config.temperature,
          abortSignal: AbortSignal.timeout(TIMEOUT_MS),
        });

        let fullContent = "";
        for await (const chunk of result.textStream) {
          fullContent += chunk;
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
        if (this.isRetryable(error)) continue;
        throw error;
      }
    }

    throw lastError || new Error("All providers exhausted");
  }

  private resolveQueue(modelId?: string, isPro?: boolean, plan?: PlanTier): ProviderConfig[] {
    if (plan) {
      if (modelId && modelId !== "auto") {
        const entry = modelRegistry.getModelById(modelId);
        if (entry) return [this.toProviderConfig(entry)];
      }
      return modelRegistry.resolve(getPlanConfig(plan)).map(this.toProviderConfig);
    }
    // Backward compat: isPro-based routing
    if (modelId && modelId !== "auto") {
      const found = PROVIDERS.find(p => p.id === modelId);
      if (found) return [found];
    }
    return isPro ? PROVIDERS : PROVIDERS.filter(p => p.isFree);
  }

  private toProviderConfig(entry: ModelEntry): ProviderConfig {
    return {
      id: entry.id,
      name: entry.displayName,
      provider: entry.provider,
      model: entry.modelId,
      temperature: entry.temperature,
      isFree: entry.tier === "free",
    };
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("429") || msg.includes("timeout");
    }
    return false;
  }
}

export const providerRouter = new ProviderRouter();
