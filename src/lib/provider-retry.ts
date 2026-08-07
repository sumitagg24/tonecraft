import { logger } from "@/lib/logger";

export type AIProvider = "openai" | "gemini" | "groq" | "openrouter";

export interface AIExecutionResult<T> {
  result: T;
  provider: AIProvider;
  attempts: number;
}

export async function executeWithFallback<T>(
  taskName: string,
  handlers: Array<{ provider: AIProvider; fn: () => Promise<T> }>
): Promise<AIExecutionResult<T>> {
  let attempts = 0;
  const errors: Array<{ provider: AIProvider; error: string }> = [];

  for (const { provider, fn } of handlers) {
    attempts++;
    try {
      logger.info(`[ProviderRetry:${taskName}] Attempting with ${provider}`);
      const result = await fn();
      return { result, provider, attempts };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.warn(`[ProviderRetry:${taskName}] ${provider} failed: ${errMsg}`);
      errors.push({ provider, error: errMsg });
    }
  }

  throw new Error(
    `[ProviderRetry:${taskName}] All providers failed: ${errors.map((e) => `${e.provider} (${e.error})`).join(", ")}`
  );
}
