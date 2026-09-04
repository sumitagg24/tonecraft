import { PlanTier, getPlanConfig, type PlanConfig } from "./plans";

// NOTE: "anthropic" was removed — no client exists for it (audit A2); Claude
// models route through openrouter. Re-add only with a real @ai-sdk/anthropic client.
//
// "custom" is a generic OpenAI-compatible slot driven purely by env vars
// (CUSTOM_AI_BASE_URL + CUSTOM_AI_API_KEY + CUSTOM_AI_MODEL). It lets any
// OpenAI-compatible endpoint — GitHub Models, Cloudflare Workers AI, Cerebras,
// DeepInfra, Together, etc. — power generations without a code change. The
// entry below only exists when all three env vars are configured.
export type ProviderName = "groq" | "openrouter" | "google" | "openai" | "custom";

const CUSTOM_AI_BASE_URL = process.env.CUSTOM_AI_BASE_URL?.trim() || "";
const CUSTOM_AI_API_KEY = process.env.CUSTOM_AI_API_KEY?.trim() || "";
const CUSTOM_AI_MODEL = process.env.CUSTOM_AI_MODEL?.trim() || "";
const CUSTOM_AI_DISPLAY =
  process.env.CUSTOM_AI_DISPLAY_NAME?.trim() || "Custom model";
const CUSTOM_AI_CONFIGURED = Boolean(
  CUSTOM_AI_BASE_URL && CUSTOM_AI_API_KEY && CUSTOM_AI_MODEL,
);

// Google model IDs are pinned to current GA releases (Gemini 3.x). `gemini-2.5-*`
// returns 404 for new API keys ("no longer available to new users"). Override via
// env if you need a different model — e.g. GOOGLE_AI_MODEL=gemini-3.5-flash-lite.
// NOTE: displayName stays static even when overridden — only modelId follows env.
const GOOGLE_FLASH_MODEL = process.env.GOOGLE_AI_MODEL || "gemini-3.6-flash";
const GOOGLE_PRO_MODEL = process.env.GOOGLE_AI_PRO_MODEL || "gemini-3.1-pro-preview";

export type ModelStatus = "available" | "deprecated" | "unavailable";

export type ModelTier = "free" | "pro";

export interface ModelCapabilities {
  streaming: boolean;
  vision: boolean;
  tools: boolean;
  json: boolean;
  reasoning: boolean;
  longContext: boolean;
}

export interface ModelEntry {
  readonly id: string;
  readonly provider: ProviderName;
  readonly displayName: string;
  readonly modelId: string;
  readonly tier: ModelTier;
  readonly creditCost: number;
  readonly contextWindow: number;
  readonly status: ModelStatus;
  readonly capabilities: ModelCapabilities;
  readonly priority: number;
  readonly temperature: number;
  readonly maxTokens: number;
}

const MODELS: readonly ModelEntry[] = [
  {
    id: "groq-llama3-70b",
    provider: "groq",
    displayName: "Llama 3.3 70B",
    modelId: "llama-3.3-70b-versatile",
    tier: "free",
    creditCost: 1,
    contextWindow: 131072,
    status: "available",
    capabilities: { streaming: true, vision: false, tools: false, json: true, reasoning: false, longContext: true },
    priority: 10,
    temperature: 0.7,
    maxTokens: 32768,
  },
  {
    id: "groq-llama3-8b",
    provider: "groq",
    displayName: "Llama 3.1 8B Instant",
    modelId: "llama-3.1-8b-instant",
    tier: "free",
    creditCost: 1,
    contextWindow: 131072,
    status: "available",
    capabilities: { streaming: true, vision: false, tools: false, json: true, reasoning: false, longContext: true },
    priority: 9,
    temperature: 0.7,
    maxTokens: 16384,
  },
  {
    id: "gemini-flash",
    provider: "google",
    displayName: "Gemini 3.6 Flash",
    modelId: GOOGLE_FLASH_MODEL,
    tier: "free",
    creditCost: 2,
    contextWindow: 1048576,
    status: "available",
    capabilities: { streaming: true, vision: true, tools: true, json: true, reasoning: true, longContext: true },
    priority: 8,
    temperature: 0.7,
    maxTokens: 8192,
  },
  {
    id: "gemini-pro",
    provider: "google",
    displayName: "Gemini 3.1 Pro",
    modelId: GOOGLE_PRO_MODEL,
    tier: "pro",
    creditCost: 5,
    contextWindow: 2097152,
    status: "available",
    capabilities: { streaming: true, vision: true, tools: true, json: true, reasoning: true, longContext: true },
    priority: 7,
    temperature: 0.7,
    maxTokens: 8192,
  },
  // Free-tier OpenRouter fallback. The Groq/Google keys are the usual first
  // choices for free users, but when those providers are unhealthy (or their
  // keys are rejected) this gives the free tier a working path so generation
  // never dies with a bare 500. Pinned to a genuinely free (`:free`) OpenRouter
  // model; costs nothing to the merchant.
  {
    id: "openrouter-glm-free",
    provider: "openrouter",
    displayName: "GLM 5.2 (free)",
    modelId: "z-ai/glm-5.2:free",
    tier: "free",
    creditCost: 1,
    contextWindow: 262144,
    status: "available",
    capabilities: { streaming: true, vision: false, tools: false, json: true, reasoning: true, longContext: true },
    priority: 3,
    temperature: 0.7,
    maxTokens: 8192,
  },
  {
    id: "openrouter-claude",
    provider: "openrouter",
    displayName: "Claude 3.7 Sonnet",
    modelId: "anthropic/claude-3.7-sonnet",
    tier: "pro",
    creditCost: 10,
    contextWindow: 200000,
    status: "available",
    capabilities: { streaming: true, vision: true, tools: true, json: true, reasoning: true, longContext: true },
    priority: 6,
    temperature: 0.7,
    maxTokens: 8192,
  },
  {
    id: "openrouter-gpt4",
    provider: "openrouter",
    displayName: "GPT-4o",
    modelId: "openai/gpt-4o",
    tier: "pro",
    creditCost: 10,
    contextWindow: 128000,
    status: "available",
    capabilities: { streaming: true, vision: true, tools: true, json: true, reasoning: true, longContext: true },
    priority: 5,
    temperature: 0.7,
    maxTokens: 16384,
  },
  // Generic OpenAI-compatible provider (env-configured). Free-tier fallback so
  // GitHub Models / Workers AI / Cerebras etc. can carry free generations once
  // CUSTOM_AI_BASE_URL + CUSTOM_AI_API_KEY + CUSTOM_AI_MODEL are set — no code
  // change needed. Sits above the :free OpenRouter last-resort so a real custom
  // key is preferred when both exist.
  ...(CUSTOM_AI_CONFIGURED
    ? [
        {
          id: "custom-openai",
          provider: "custom" as ProviderName,
          displayName: CUSTOM_AI_DISPLAY,
          modelId: CUSTOM_AI_MODEL,
          tier: "free" as const,
          creditCost: 1,
          contextWindow: 200000,
          status: "available" as const,
          capabilities: { streaming: true, vision: false, tools: false, json: true, reasoning: false, longContext: true },
          priority: 4,
          temperature: 0.7,
          maxTokens: 8192,
        },
      ]
    : []),
];

const unavailableModels = new Set<string>();

export function markModelUnavailable(id: string): void {
  unavailableModels.add(id);
}

export function isModelAvailable(id: string): boolean {
  return !unavailableModels.has(id);
}

export function getAllModels(): readonly ModelEntry[] {
  return MODELS;
}

export function getAvailableModels(): readonly ModelEntry[] {
  return [...MODELS]
    .filter((m) => m.status === "available" && !unavailableModels.has(m.id))
    .sort((a, b) => b.priority - a.priority);
}

export function getModelById(id: string): ModelEntry | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getModelByProviderModelId(provider: ProviderName, modelId: string): ModelEntry | undefined {
  return MODELS.find((m) => m.provider === provider && m.modelId === modelId);
}

export function getModelsByProvider(provider: ProviderName): readonly ModelEntry[] {
  return MODELS.filter((m) => m.provider === provider);
}

export function getModelsByTier(tier: PlanTier): readonly ModelEntry[] {
  const config: Readonly<PlanConfig> = getPlanConfig(tier);
  return getAvailableModels().filter((m) => m.tier === "free" || config.modelTier === "pro");
}

export function getFallbackModels(): readonly ModelEntry[] {
  return getAvailableModels().filter((m) => m.tier === "free").sort((a, b) => b.priority - a.priority);
}

export function getCreditCost(modelId: string): number | undefined {
  return getModelById(modelId)?.creditCost;
}

export function getSupportedProviders(): readonly ProviderName[] {
  return Array.from(new Set(MODELS.map((m) => m.provider)));
}

export function getModelsByCapability(capability: keyof ModelCapabilities): readonly ModelEntry[] {
  return getAvailableModels().filter((m) => m.capabilities[capability]);
}
