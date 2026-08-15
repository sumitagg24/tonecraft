import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const loggerError = jest.fn();
jest.mock("@/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: (...args: unknown[]) => loggerError(...args),
  },
}));

import { AIEngineError, classifyAIError, type AIErrorCode } from "@/engine/AIEngineError";
import {
  AIProviderError,
  AIEngineError as SimpleEngineError,
  classifyProviderError,
  isRetryable,
  isDecommission,
} from "@/engine/AIProviderError";

describe("AIEngineError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds a diagnostic message from the context", () => {
    const err = new AIEngineError({ errorCode: "timeout", provider: "groq", model: "llama" });
    expect(err.name).toBe("AIEngineError");
    expect(err.message).toBe("[timeout] provider=groq model=llama");
    expect(err).toBeInstanceOf(Error);
  });

  it("omits absent provider and model from the message", () => {
    expect(new AIEngineError({ errorCode: "unknown" }).message).toBe("[unknown]");
  });

  it("keeps the supplied request id and generates one otherwise", () => {
    expect(new AIEngineError({ errorCode: "timeout", requestId: "req-1" }).requestId).toBe("req-1");
    expect(new AIEngineError({ errorCode: "timeout" }).requestId).toMatch(/[0-9a-f-]{36}/);
  });

  it("exposes the context and cause", () => {
    const cause = new Error("upstream boom");
    const err = new AIEngineError(
      {
        errorCode: "rate_limited",
        provider: "google",
        model: "gemini",
        status: 429,
        retryProvider: "groq",
        retryModel: "llama",
        latency: 42,
      },
      cause,
    );
    expect(err.status).toBe(429);
    expect(err.retryProvider).toBe("groq");
    expect(err.retryModel).toBe("llama");
    expect(err.latency).toBe(42);
    expect(err.cause).toBe(cause);
  });

  it("logs once with the full context", () => {
    new AIEngineError({ errorCode: "quota_exceeded", provider: "groq" }, new Error("boom"));
    expect(loggerError).toHaveBeenCalledTimes(1);
    expect(loggerError).toHaveBeenCalledWith(
      "AIEngineError",
      expect.objectContaining({ errorCode: "quota_exceeded", provider: "groq", cause: "boom" }),
    );
  });

  it("serializes to a user-safe payload without internals", () => {
    const json = new AIEngineError({ errorCode: "insufficient_credits", provider: "groq" }).toJSON();
    expect(Object.keys(json).sort()).toEqual(["error", "requestId"]);
    expect(json.error).toBe("You don't have enough credits for this action.");
  });

  it.each<[AIErrorCode, RegExp]>([
    ["model_decommissioned", /no longer available/],
    ["model_not_found", /could not be found/],
    ["invalid_model", /Invalid model configuration/],
    ["quota_exceeded", /high demand/],
    ["rate_limited", /too quickly/],
    ["timeout", /took too long/],
    ["network_error", /network issue/],
    ["provider_unavailable", /temporarily unavailable/],
    ["authentication_error", /configuration issue/],
    ["all_providers_exhausted", /All AI services/],
    ["insufficient_credits", /enough credits/],
    ["invalid_configuration", /configuration issue/],
    ["unknown", /Something went wrong/],
  ])("maps %s to a friendly message", (code, matcher) => {
    expect(new AIEngineError({ errorCode: code }).userMessage).toMatch(matcher);
  });
});

describe("classifyAIError", () => {
  it("carries the provider, model and status through", () => {
    const ctx = classifyAIError(Object.assign(new Error("rate limit"), { status: 429 }), "groq", "llama");
    expect(ctx).toEqual({ provider: "groq", model: "llama", errorCode: "rate_limited", status: 429 });
  });

  it.each<[string, AIErrorCode]>([
    ["Model was decommissioned", "model_decommissioned"],
    ["this model is deprecated", "model_decommissioned"],
    ["model not found", "model_not_found"],
    ["unknown model foo", "model_not_found"],
    ["invalid request payload", "invalid_model"],
    ["insufficient_quota for org", "quota_exceeded"],
    ["Rate limit reached", "rate_limited"],
    ["too many requests", "rate_limited"],
    ["request timed out", "timeout"],
    ["deadline exceeded", "timeout"],
    ["ECONNREFUSED 127.0.0.1", "network_error"],
    ["socket hang up", "network_error"],
    ["503 service unavailable", "provider_unavailable"],
    ["unauthorized: bad api key", "authentication_error"],
    ["something odd happened", "unknown"],
  ])("classifies %j", (message, expected) => {
    expect(classifyAIError(new Error(message)).errorCode).toBe(expected);
  });

  it("classifies non-Error values by their string form", () => {
    expect(classifyAIError("Gateway timeout").errorCode).toBe("timeout");
    expect(classifyAIError(429).errorCode).toBe("unknown");
    expect(classifyAIError(undefined).status).toBeUndefined();
  });

  it("uses the status code when the message is uninformative", () => {
    expect(classifyAIError({ status: 429, message: "" }).errorCode).toBe("rate_limited");
  });
});

describe("AIProviderError", () => {
  it("captures the code and metadata", () => {
    const err = new AIProviderError("timeout", "took too long", { provider: "groq", attempt: 2 });
    expect(err.name).toBe("AIProviderError");
    expect(err.code).toBe("timeout");
    expect(err.meta.attempt).toBe(2);
  });

  it("defaults the metadata to an empty object", () => {
    expect(new AIProviderError("unknown", "boom").meta).toEqual({});
  });

  it("produces a structured log record", () => {
    const err = new AIProviderError("rate_limited", "slow down", {
      provider: "google",
      model: "gemini",
      retryProvider: "groq",
      retryModel: "llama",
      latency: 10,
      requestId: "req-2",
      statusCode: 429,
      attempt: 1,
    });
    expect(err.toLog()).toEqual({
      type: "ai_provider_error",
      code: "rate_limited",
      message: "slow down",
      provider: "google",
      model: "gemini",
      retryProvider: "groq",
      retryModel: "llama",
      latency: 10,
      requestId: "req-2",
      statusCode: 429,
      attempt: 1,
    });
  });

  it("maps codes to user-facing copy", () => {
    expect(new AIProviderError("insufficient_credits", "x").toUser()).toEqual({
      error: "You've run out of credits. Upgrade your plan to continue.",
      code: "insufficient_credits",
    });
    expect(new AIProviderError("all_providers_exhausted", "x").toUser().error).toMatch(/All AI providers/);
    expect(new AIProviderError("rate_limited", "x").toUser().error).toMatch(/Too many requests/);
    expect(new AIProviderError("timeout", "x").toUser().error).toMatch(/took too long/);
    expect(new AIProviderError("model_not_found", "x").toUser().error).toMatch(/no longer available/);
    expect(new AIProviderError("invalid_model", "x").toUser().error).toMatch(/no longer available/);
    expect(new AIProviderError("network_error", "x").toUser().error).toMatch(/Something went wrong/);
  });
});

describe("SimpleEngineError", () => {
  it("defaults to a recoverable engine error", () => {
    const err = new SimpleEngineError("boom");
    expect(err.code).toBe("engine_error");
    expect(err.recoverable).toBe(true);
    expect(err.name).toBe("AIEngineError");
  });

  it("accepts an explicit code and recoverability", () => {
    const err = new SimpleEngineError("boom", "fatal", false);
    expect(err.code).toBe("fatal");
    expect(err.recoverable).toBe(false);
  });
});

describe("isRetryable / isDecommission", () => {
  it("marks transient failures retryable", () => {
    for (const code of ["quota_exceeded", "rate_limited", "timeout", "network_error", "provider_unavailable"] as const) {
      expect(isRetryable(code)).toBe(true);
    }
  });

  it("does not retry permanent failures", () => {
    expect(isRetryable("authentication_error")).toBe(false);
    expect(isRetryable("model_not_found")).toBe(false);
  });

  it("recognizes decommissioned-model codes", () => {
    expect(isDecommission("model_decommissioned")).toBe(true);
    expect(isDecommission("model_not_found")).toBe(true);
    expect(isDecommission("invalid_model")).toBe(true);
    expect(isDecommission("timeout")).toBe(false);
  });
});

describe("classifyProviderError", () => {
  it("passes an AIProviderError through untouched", () => {
    const original = new AIProviderError("timeout", "slow");
    expect(classifyProviderError(original)).toBe(original);
  });

  it.each([
    ["model decommissioned", "model_decommissioned"],
    ["deprecated model", "model_decommissioned"],
    ["model not found", "model_not_found"],
    ["unknown model", "model_not_found"],
    ["invalid model id", "invalid_model"],
    ["the model does not exist", "invalid_model"],
    ["quota reached", "quota_exceeded"],
    ["rate limit hit", "rate_limited"],
    ["429 slow down", "rate_limited"],
    ["timed out", "timeout"],
    ["408 request timeout", "timeout"],
    ["fetch failed", "network_error"],
    ["503 unavailable", "provider_unavailable"],
    ["401 unauthorized", "authentication_error"],
    ["weird failure", "unknown"],
  ])("classifies %j", (message, expected) => {
    const err = classifyProviderError(new Error(message));
    expect(err.code).toBe(expected);
    expect(err.message).toContain(message);
  });

  it("classifies non-Error values", () => {
    expect(classifyProviderError("network glitch").code).toBe("network_error");
    expect(classifyProviderError(null).code).toBe("unknown");
  });
});
