import { PlanTier, getPlanConfig, type PlanConfig } from "./plans";

export type ProviderName = "groq" | "openrouter" | "google" | "openai";

export type ModelTier = "free" | "pro";

export interface ModelEntry {
  readonly id: string;
  readonly provider: ProviderName;
  readonly displayName: string;
  readonly modelId: string;
  readonly tier: ModelTier;
  readonly creditCost: number;
  readonly contextWindow: number;
  readonly supportsStreaming: boolean;
  readonly supportsVision: boolean;
  readonly isFallback: boolean;
  readonly temperature: number;
}

const MODELS: readonly ModelEntry[] = [
  {
    id: "groq-llama3-70b",
    provider: "groq",
    displayName: "Llama 3.1 70B",
    modelId: "llama-3.1-70b-versatile",
    tier: "free",
    creditCost: 1,
    contextWindow: 8192,
    supportsStreaming: true,
    supportsVision: false,
    isFallback: true,
    temperature: 0.7,
  },
  {
    id: "groq-mixtral-8x7b",
    provider: "groq",
    displayName: "Mixtral 8x7B",
    modelId: "mixtral-8x7b-32768",
    tier: "free",
    creditCost: 1,
    contextWindow: 32768,
    supportsStreaming: true,
    supportsVision: false,
    isFallback: true,
    temperature: 0.7,
  },
  {
    id: "gemini-flash",
    provider: "google",
    displayName: "Gemini 1.5 Flash",
    modelId: "gemini-1.5-flash",
    tier: "free",
    creditCost: 2,
    contextWindow: 16384,
    supportsStreaming: true,
    supportsVision: true,
    isFallback: false,
    temperature: 0.7,
  },
  {
    id: "gemini-pro",
    provider: "google",
    displayName: "Gemini 1.5 Pro",
    modelId: "gemini-1.5-pro",
    tier: "pro",
    creditCost: 5,
    contextWindow: 32768,
    supportsStreaming: true,
    supportsVision: true,
    isFallback: false,
    temperature: 0.7,
  },
  {
    id: "openrouter-claude",
    provider: "openrouter",
    displayName: "Claude 3.5 Sonnet",
    modelId: "anthropic/claude-3.5-sonnet",
    tier: "pro",
    creditCost: 10,
    contextWindow: 32768,
    supportsStreaming: true,
    supportsVision: true,
    isFallback: false,
    temperature: 0.7,
  },
  {
    id: "openrouter-gpt4",
    provider: "openrouter",
    displayName: "GPT-4o",
    modelId: "openai/gpt-4o",
    tier: "pro",
    creditCost: 10,
    contextWindow: 32768,
    supportsStreaming: true,
    supportsVision: true,
    isFallback: false,
    temperature: 0.7,
  },
];

export function getAllModels(): readonly ModelEntry[] {
  return MODELS;
}

export function getModelById(id: string): ModelEntry | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(provider: ProviderName): readonly ModelEntry[] {
  return MODELS.filter((m) => m.provider === provider);
}

export function getModelsByTier(tier: PlanTier): readonly ModelEntry[] {
  const config: Readonly<PlanConfig> = getPlanConfig(tier);
  return MODELS.filter((m) => m.tier === "free" || config.modelTier === "pro");
}

export function getFallbackModels(): readonly ModelEntry[] {
  return MODELS.filter((m) => m.isFallback);
}

export function getCreditCost(modelId: string): number | undefined {
  return getModelById(modelId)?.creditCost;
}

export function getSupportedProviders(): readonly ProviderName[] {
  return Array.from(new Set(MODELS.map((m) => m.provider)));
}
