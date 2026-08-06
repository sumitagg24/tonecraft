export type Intent =
  | "rewrite" | "reply" | "social" | "email" | "grammar"
  | "translate" | "resume" | "cover-letter" | "summarize"
  | "enhance" | "custom";

export type Tone =
  | "professional" | "friendly" | "casual" | "formal" | "luxury"
  | "corporate" | "ceo" | "genz" | "millennial" | "dating"
  | "funny" | "sarcastic" | "polite" | "romantic" | "creative"
  | "minimal" | "academic";

export type Platform =
  | "whatsapp" | "instagram" | "slack" | "discord" | "linkedin"
  | "twitter" | "telegram" | "email" | "messenger" | "facebook"
  | "threads" | "youtube";

export type WritingStyle = "standard" | "storytelling" | "persuasive" | "instructional" | "conversational";

export type ResponseLength = "short" | "medium" | "long";

export type Formality = "casual" | "neutral" | "formal";

export interface IntentConfig {
  intent: Intent;
  tone?: Tone;
  platform?: Platform;
  style?: WritingStyle;
  length?: ResponseLength;
  formality?: Formality;
  creativity?: number;
  emojiLevel?: number;
  language?: string;
  audience?: string;
}

export interface ProviderResult {
  content: string;
  model: string;
  provider: string;
  tokens: number;
  latency: number;
  finishReason?: string;
}

/**
 * Union of events emitted by the streaming API (`AIEngine.stream` /
 * `WorkflowEngine.executeStream`).
 */
export type EngineStreamEvent =
  | { type: "token"; content: string; step?: string }
  | { type: "done"; result: EngineResult }
  | { type: "error"; message: string };

export interface EngineResult {
  content: string;
  provider: string;
  model: string;
  tokens: number;
  latency: number;
  metadata: {
    intent: Intent;
    tone?: Tone;
    platform?: Platform;
    workflow?: string;
    generatedAt: string;
    model: string;
    provider: string;
    tokens: number;
    latency: number;
  };
}

export interface WorkflowStep {
  id: string;
  intent: Intent;
  config?: Partial<IntentConfig>;
  prompt?: string;
  dependsOn?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

import type { PlanTier } from "@/config/plans";
import type { ProviderName } from "@/config/models";
import type { ModelMessage } from "ai";

export type { ModelMessage } from "ai";

export type CapabilityTier = "writing" | "long-context" | "coding" | "creative" | "vision";

export interface CapabilityContext {
  hasFiles?: boolean;
  tokenCount?: number;
  creativity?: number;
  isCoding?: boolean;
}

export interface RouteOptions {
  system: string;
  messages: ModelMessage[];
  modelId?: string;
  plan?: PlanTier;
  intent?: Intent;
  capabilityContext?: CapabilityContext;
  /** External abort signal (e.g. HTTP request abort) — chains into the provider call. */
  signal?: AbortSignal;
  /** Registered AI tools to make available to the model (A7). */
  tools?: import("./tools").AITool[];
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

export interface EngineOptions {
  intent: Intent;
  prompt?: string;
  tone?: Tone;
  platform?: Platform;
  language?: string;
  audience?: string;
  length?: ResponseLength;
  creativity?: number;
  emojiLevel?: number;
  formality?: Formality;
  style?: WritingStyle;
  history?: ConversationMessage[];
  workflow?: Workflow;
  context?: Record<string, unknown>;
  persona?: {
    name?: string;
    systemPrompt?: string;
    tone?: string;
  };
  modelId?: string;
  userId?: string;
  plan?: PlanTier;
  /** External abort signal (e.g. HTTP request abort) — chains into the provider call. */
  signal?: AbortSignal;
  /** Registered AI tools to make available to the model (A7). */
  tools?: import("./tools").AITool[];
}

export interface ProviderConfig {
  id: string;
  name: string;
  provider: ProviderName;
  model: string;
  temperature: number;
  isFree: boolean;
  maxTokens?: number;
}
