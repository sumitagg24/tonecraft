export type AIErrorCode =
  | "model_decommissioned"
  | "model_not_found"
  | "invalid_model"
  | "quota_exceeded"
  | "rate_limited"
  | "timeout"
  | "network_error"
  | "provider_unavailable"
  | "authentication_error"
  | "insufficient_credits"
  | "all_providers_exhausted"
  | "unknown";

export interface AIErrorMeta {
  provider?: string;
  model?: string;
  retryProvider?: string;
  retryModel?: string;
  latency?: number;
  requestId?: string;
  statusCode?: number;
  attempt?: number;
}

export class AIProviderError extends Error {
  readonly code: AIErrorCode;
  readonly meta: AIErrorMeta;

  constructor(code: AIErrorCode, message: string, meta: AIErrorMeta = {}) {
    super(message);
    this.name = "AIProviderError";
    this.code = code;
    this.meta = meta;
  }

  toLog(): Record<string, unknown> {
    return {
      type: "ai_provider_error",
      code: this.code,
      message: this.message,
      provider: this.meta.provider,
      model: this.meta.model,
      retryProvider: this.meta.retryProvider,
      retryModel: this.meta.retryModel,
      latency: this.meta.latency,
      requestId: this.meta.requestId,
      statusCode: this.meta.statusCode,
      attempt: this.meta.attempt,
    };
  }

  toUser(): { error: string; code: string } {
    return { error: this.userMessage(), code: this.code };
  }

  private userMessage(): string {
    switch (this.code) {
      case "insufficient_credits":
        return "You've run out of credits. Upgrade your plan to continue.";
      case "all_providers_exhausted":
        return "All AI providers are currently unavailable. Please try again in a moment.";
      case "rate_limited":
        return "Too many requests. Please wait a moment and try again.";
      case "timeout":
        return "The AI took too long to respond. Please try again.";
      case "model_decommissioned":
      case "model_not_found":
      case "invalid_model":
        return "This model is no longer available. We've switched to an alternative.";
      default:
        return "Something went wrong generating a response. Please try again.";
    }
  }
}

export class AIEngineError extends Error {
  readonly code: string;
  readonly recoverable: boolean;

  constructor(message: string, code: string = "engine_error", recoverable: boolean = true) {
    super(message);
    this.name = "AIEngineError";
    this.code = code;
    this.recoverable = recoverable;
  }
}

const RETRYABLE_CODES: Set<AIErrorCode> = new Set([
  "quota_exceeded",
  "rate_limited",
  "timeout",
  "network_error",
  "provider_unavailable",
]);

const DECOMMISSION_CODES: Set<AIErrorCode> = new Set([
  "model_decommissioned",
  "model_not_found",
  "invalid_model",
]);

export function isRetryable(code: AIErrorCode): boolean {
  return RETRYABLE_CODES.has(code);
}

export function isDecommission(code: AIErrorCode): boolean {
  return DECOMMISSION_CODES.has(code);
}

export function classifyProviderError(err: unknown): AIProviderError {
  if (err instanceof AIProviderError) return err;

  const msg = String(err instanceof Error ? err.message : err).toLowerCase();

  if (msg.includes("decommissioned") || msg.includes("deprecated")) {
    return new AIProviderError("model_decommissioned", String(err));
  }
  if (msg.includes("model not found") || msg.includes("unknown model")) {
    return new AIProviderError("model_not_found", String(err));
  }
  if (msg.includes("invalid model") || msg.includes("does not exist")) {
    return new AIProviderError("invalid_model", String(err));
  }
  if (msg.includes("quota") || msg.includes("exceeded") || msg.includes("insufficient")) {
    return new AIProviderError("quota_exceeded", String(err));
  }
  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("429")) {
    return new AIProviderError("rate_limited", String(err));
  }
  if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("408")) {
    return new AIProviderError("timeout", String(err));
  }
  if (msg.includes("network") || msg.includes("econnrefused") || msg.includes("enotfound") || msg.includes("fetch failed")) {
    return new AIProviderError("network_error", String(err));
  }
  if (msg.includes("unavailable") || msg.includes("503") || msg.includes("502") || msg.includes("500")) {
    return new AIProviderError("provider_unavailable", String(err));
  }
  if (msg.includes("auth") || msg.includes("unauthorized") || msg.includes("401") || msg.includes("403") || msg.includes("api key")) {
    return new AIProviderError("authentication_error", String(err));
  }

  return new AIProviderError("unknown", String(err));
}
