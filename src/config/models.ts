import { PlanTier, getPlanConfig, type PlanConfig } from "./plans";

// NOTE: "anthropic" was removed — no client exists for it (audit A2); Claude
// models route through openrouter. Re-add only with a real @ai-sdk/anthropic client.
export type ProviderName = "groq" | "openrouter" | "google" | "openai";

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
    displayName: "Gemini 2.5 Flash",
    modelId: "gemini-2.5-flash",
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
    displayName: "Gemini 2.5 Pro",
    modelId: "gemini-2.5-pro",
    tier: "pro",
    creditCost: 5,
    contextWindow: 2097152,
    status: "available",
    capabilities: { streaming: true, vision: true, tools: true, json: true, reasoning: true, longContext: true },
    priority: 7,
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
