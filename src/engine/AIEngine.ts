import type { EngineOptions, EngineResult, CapabilityContext } from "./types";
import { ProviderRouter, providerRouter } from "./ProviderRouter";
import { ResponseFormatter, responseFormatter } from "./ResponseFormatter";
import { ContextBuilder, contextBuilder, type BuiltContext } from "./ContextBuilder";
import { IntentEngine, intentEngine } from "./IntentEngine";
import { WorkflowEngine } from "./WorkflowEngine";
import { buildPrompt } from "@/prompts";
import { prisma } from "@/lib/prisma";
import { usageGuard } from "@/services/UsageGuard";
import { modelRegistry } from "@/services/ModelRegistry";
import { type PlanTier, getPlanConfig } from "@/config/plans";
import { CODE_PATTERN } from "@/lib/capabilities";

export class AIEngine {
  private providerRouter: ProviderRouter;
  private responseFormatter: ResponseFormatter;
  private contextBuilder: ContextBuilder;
  private intentEngine: IntentEngine;
  private workflowEngine: WorkflowEngine;

  constructor() {
    this.providerRouter = providerRouter;
    this.responseFormatter = responseFormatter;
    this.contextBuilder = contextBuilder;
    this.intentEngine = intentEngine;
    this.workflowEngine = new WorkflowEngine(this);
  }

  async generate(options: EngineOptions): Promise<EngineResult> {
    // Handle workflows
    if (options.workflow) {
      return this.workflowEngine.execute(options);
    }

    // Resolve intent → config
    const intentConfig = this.intentEngine.resolve(options.intent, {
      tone: options.tone,
      platform: options.platform,
      length: options.length,
      creativity: options.creativity,
      emojiLevel: options.emojiLevel,
      language: options.language,
      audience: options.audience,
      formality: options.formality,
    });

    // Build prompt from library
    const promptText = buildPrompt(intentConfig.intent, options.prompt || "", intentConfig);

    // Build full context (history + preferences + persona + prompt)
    const built = this.contextBuilder.build(
      {
        history: options.history,
        currentMessage: promptText,
        preferences: {
          language: options.language,
          creativity: options.creativity,
          length: options.length,
        },
      },
      intentConfig
    );

    // Check credits before execution
    if (options.userId && options.plan) {
      const minCost = minCreditCost(options.plan, options.modelId);
      const canProceed = await usageGuard.canAfford(options.userId, minCost);
      if (!canProceed) {
        throw new Error("Insufficient credits");
      }
    }

    // Route to provider
    const providerResult = await this.providerRouter.route({
      system: built.systemMessage,
      messages: built.messages,
      modelId: options.modelId,
      plan: options.plan,
      intent: intentConfig.intent,
      capabilityContext: this.buildCapabilityContext(options, built),
    });

    // Deduct credits after success
    if (options.userId && options.plan) {
      const cost = modelRegistry.getCreditCost(providerResult.model);
      if (cost === undefined) {
        throw new Error(`Unknown credit cost for model: ${providerResult.model}`);
      }
      await usageGuard.record({
        userId: options.userId,
        modelId: providerResult.model,
        credits: cost,
      });
    }

    // Track usage
    if (options.userId) {
      this.trackUsage(options.userId, providerResult).catch(() => {});
    }

    // Format response
    return this.responseFormatter.format(providerResult, {
      intent: intentConfig.intent,
      tone: intentConfig.tone,
      platform: intentConfig.platform,
    });
  }

  async *stream(options: EngineOptions): AsyncGenerator<
    { type: "token"; content: string } | { type: "done"; result: EngineResult } | { type: "error"; message: string }
  > {
    // Handle workflows with streaming
    if (options.workflow) {
      yield* this.workflowEngine.executeStream(options);
      return;
    }

    // Resolve intent → config
    const intentConfig = this.intentEngine.resolve(options.intent, {
      tone: options.tone,
      platform: options.platform,
      length: options.length,
      creativity: options.creativity,
      emojiLevel: options.emojiLevel,
      language: options.language,
      audience: options.audience,
      formality: options.formality,
    });

    // Build prompt
    const promptText = buildPrompt(intentConfig.intent, options.prompt || "", intentConfig);

    // Build context
    const built = this.contextBuilder.build(
      {
        history: options.history,
        currentMessage: promptText,
        preferences: {
          language: options.language,
          creativity: options.creativity,
          length: options.length,
        },
      },
      intentConfig
    );

    let fullContent = "";
    let finalTokens = 0;
    let finalLatency = 0;
    let finalModel = "";
    let finalProvider = "";

    // Check credits before execution
    if (options.userId && options.plan) {
      const minCost = minCreditCost(options.plan, options.modelId);
      const canProceed = await usageGuard.canAfford(options.userId, minCost);
      if (!canProceed) {
        yield { type: "error", message: "Insufficient credits" };
        return;
      }
    }

    try {
      const stream = this.providerRouter.stream({
        system: built.systemMessage,
        messages: built.messages,
        modelId: options.modelId,
        plan: options.plan,
        intent: intentConfig.intent,
        capabilityContext: this.buildCapabilityContext(options, built),
      });

      for await (const chunk of stream) {
        if (chunk.finishReason === "__done__") {
          finalTokens = chunk.tokens;
          finalLatency = chunk.latency;
          finalModel = chunk.model;
          finalProvider = chunk.provider;
        } else {
          fullContent += chunk.content;
          yield { type: "token", content: chunk.content };
        }
      }

      // Deduct credits after successful stream completion
      if (options.userId && options.plan) {
        const cost = modelRegistry.getCreditCost(finalModel);
        if (cost === undefined) {
          throw new Error(`Unknown credit cost for model: ${finalModel}`);
        }
        await usageGuard.record({
          userId: options.userId,
          modelId: finalModel,
          credits: cost,
        });
      }

      const result = this.responseFormatter.format(
        { content: fullContent, model: finalModel, provider: finalProvider, tokens: finalTokens, latency: finalLatency },
        { intent: intentConfig.intent, tone: intentConfig.tone, platform: intentConfig.platform }
      );

      if (options.userId) {
        this.trackUsage(options.userId, {
          content: fullContent, model: finalModel, provider: finalProvider, tokens: finalTokens, latency: finalLatency,
        }).catch(() => {});
      }

      yield { type: "done", result };
    } catch (error) {
      yield { type: "error", message: (error as Error).message };
    }
  }

  private buildCapabilityContext(options: EngineOptions, built: BuiltContext): CapabilityContext {
    const prompt = options.prompt ?? "";
    const contentLength =
      built.systemMessage.length +
      built.messages.reduce((sum, m) => sum + m.content.length, 0) +
      prompt.length;
    const tokenCount = Math.ceil(contentLength / 4);

    return {
      hasFiles: options.context?.hasFiles === true || false,
      tokenCount,
      creativity: options.creativity,
      isCoding: CODE_PATTERN.test(prompt),
    };
  }

  async generateText(options: { prompt: string; modelId?: string; userId?: string }): Promise<string> {
    const result = await this.generate({
      intent: "custom",
      prompt: options.prompt,
      modelId: options.modelId,
      userId: options.userId,
    });
    return result.content;
  }

  private async trackUsage(userId: string, data: { content?: string; model: string; provider: string; tokens: number; latency: number }) {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    await Promise.all([
      prisma.usageRecord.create({
        data: {
          userId,
          provider: data.provider || "unknown",
          model: data.model || "unknown",
          tokens: data.tokens,
          latency: data.latency,
          success: true,
        },
      }),
      prisma.usage.upsert({
        where: { userId },
        create: {
          userId,
          messagesSent: 1,
          tokensUsed: data.tokens,
          dailyMessages: 1,
          monthlyMessages: 1,
          dailyTokens: data.tokens,
          monthlyTokens: data.tokens,
          lastDailyReset: dayStart,
          lastMonthlyReset: monthStart,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          messagesSent: { increment: 1 },
          tokensUsed: { increment: data.tokens },
          dailyMessages: { increment: 1 },
          monthlyMessages: { increment: 1 },
          dailyTokens: { increment: data.tokens },
          monthlyTokens: { increment: data.tokens },
        },
      }),
    ]);
  }
}

function minCreditCost(plan: PlanTier, modelId?: string): number {
  if (modelId && modelId !== "auto") {
    const cost = modelRegistry.getCreditCost(modelId);
    if (cost !== undefined) return cost;
  }
  const models = modelRegistry.resolve(getPlanConfig(plan));
  const costs = models.map((m) => m.creditCost).filter((c) => c > 0);
  return costs.length > 0 ? Math.min(...costs) : 1;
}

export const aiEngine = new AIEngine();
