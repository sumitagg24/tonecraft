import type { EngineResult, Intent, Tone, Platform, ProviderResult } from "./types";

export class ResponseFormatter {
  format(
    providerResult: ProviderResult,
    meta: { intent: Intent; tone?: Tone; platform?: Platform; workflow?: string }
  ): EngineResult {
    return {
      content: providerResult.content,
      provider: providerResult.provider,
      model: providerResult.model,
      tokens: providerResult.tokens,
      latency: providerResult.latency,
      metadata: {
        intent: meta.intent,
        tone: meta.tone,
        platform: meta.platform,
        workflow: meta.workflow,
        generatedAt: new Date().toISOString(),
        model: providerResult.model,
        provider: providerResult.provider,
        tokens: providerResult.tokens,
        latency: providerResult.latency,
      },
    };
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  truncate(content: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    return content.length > maxChars ? content.slice(0, maxChars) + "..." : content;
  }
}

export const responseFormatter = new ResponseFormatter();
