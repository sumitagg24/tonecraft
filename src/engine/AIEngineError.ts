import { logger } from "@/lib/logger";

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
  | "all_providers_exhausted"
  | "insufficient_credits"
  | "invalid_configuration"
  | "unknown";

export interface AIErrorContext {
  provider?: string;
  model?: string;
  errorCode: AIErrorCode;
  status?: number;
  retryProvider?: string;
  retryModel?: string;
  latency?: number;
  requestId?: string;
}

export class AIEngineError extends Error {
  public readonly provider?: string;
  public readonly model?: string;
  public readonly errorCode: AIErrorCode;
  public readonly status?: number;
  public readonly retryProvider?: string;
  public readonly retryModel?: string;
  public readonly latency?: number;
  public readonly requestId: string;
  public readonly userMessage: string;

  constructor(context: AIErrorContext, cause?: Error) {
    const message = `[${context.errorCode}]${context.provider ? ` provider=${context.provider}` : ""}${context.model ? ` model=${context.model}` : ""}`;
    super(message);

    this.name = "AIEngineError";
    this.provider = context.provider;
    this.model = context.model;
    this.errorCode = context.errorCode;
    this.status = context.status;
    this.retryProvider = context.retryProvider;
    this.retryModel = context.retryModel;
    this.latency = context.latency;
    this.requestId = context.requestId ?? crypto.randomUUID();
    this.userMessage = getUserMessage(context.errorCode);
    this.cause = cause;

    logger.error("AIEngineError", {
      provider: context.provider,
      model: context.model,
      errorCode: context.errorCode,
      status: context.status,
      retryProvider: context.retryProvider,
      retryModel: context.retryModel,
      latency: context.latency,
      requestId: this.requestId,
      cause: cause?.message,
    });
  }

  toJSON() {
    return {
      error: this.userMessage,
      requestId: this.requestId,
    };
  }
}

function getUserMessage(code: AIErrorCode): string {
  switch (code) {
    case "model_decommissioned":
      return "This AI model is no longer available. We've automatically switched to another model.";
    case "model_not_found":
      return "The requested AI model could not be found. Using the best available alternative.";
    case "invalid_model":
      return "Invalid model configuration. A compatible model has been selected automatically.";
    case "quota_exceeded":
      return "Service temporarily unavailable due to high demand. Please try again in a moment.";
    case "rate_limited":
      return "You're sending requests too quickly. Please wait a moment before trying again.";
    case "timeout":
      return "The AI service took too long to respond. Retrying with an alternative provider.";
    case "network_error":
      return "A network issue occurred. We've automatically switched to a backup service.";
    case "provider_unavailable":
      return "The AI service is temporarily unavailable. Using an alternative provider.";
    case "authentication_error":
      return "There's a configuration issue with one of our AI providers. Our team has been notified.";
    case "all_providers_exhausted":
      return "All AI services are currently unavailable. Please try again later.";
    case "insufficient_credits":
      return "You don't have enough credits for this action.";
    case "invalid_configuration":
      return "There's a configuration issue with the AI system. Our team has been notified.";
    case "unknown":
    default:
      return "Something went wrong while generating a response. Please try again.";
  }
}

export function classifyAIError(error: unknown, provider?: string, model?: string): AIErrorContext {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const status =
    typeof error === "object" && error !== null ? (error as { status?: number }).status : undefined;

  let errorCode: AIErrorCode;

  if (message.includes("decommissioned") || message.includes("deprecated") || message.includes("removed")) {
    errorCode = "model_decommissioned";
  } else if (message.includes("model not found") || message.includes("unknown model") || message.includes("does not exist")) {
    errorCode = "model_not_found";
  } else if (message.includes("invalid") && (message.includes("model") || message.includes("request"))) {
    errorCode = "invalid_model";
  } else if (message.includes("quota") || message.includes("exhausted") || message.includes("insufficient_quota")) {
    errorCode = "quota_exceeded";
  } else if (message.includes("rate limit") || message.includes("too many requests") || status === 429) {
    errorCode = "rate_limited";
  } else if (message.includes("timeout") || message.includes("timed out") || message.includes("deadline exceeded")) {
    errorCode = "timeout";
  } else if (message.includes("network") || message.includes("econnrefused") || message.includes("econnreset") || message.includes("enotfound") || message.includes("socket")) {
    errorCode = "network_error";
  } else if (message.includes("unavailable") || message.includes("503") || message.includes("502") || message.includes("service unavailable")) {
    errorCode = "provider_unavailable";
  } else if (message.includes("auth") || message.includes("unauthorized") || message.includes("api key") || message.includes("401") || message.includes("403")) {
    errorCode = "authentication_error";
  } else {
    errorCode = "unknown";
  }

  return { provider, model, errorCode, status };
}
