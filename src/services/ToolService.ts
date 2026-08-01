import { aiEngine } from "@/engine/AIEngine";
import { intentEngine } from "@/engine/IntentEngine";
import { planService } from "@/services/PlanService";
import type { EngineResult } from "@/types";

export class ToolService {
  async execute(options: {
    toolId: string;
    input: string;
    tone?: string;
    platform?: string;
    language?: string;
    audience?: string;
    length?: string;
    creativity?: number;
    formality?: string;
    modelId?: string;
    userId?: string;
  }): Promise<EngineResult> {
    const plan = options.userId ? await planService.getPlan(options.userId) : undefined;
    const config = intentEngine.resolve(options.toolId, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tone: options.tone as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      platform: options.platform as any,
      language: options.language,
      audience: options.audience,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      length: options.length as any,
      creativity: options.creativity,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formality: options.formality as any,
    });

    const result = await aiEngine.generate({
      intent: config.intent,
      prompt: options.input,
      tone: config.tone,
      platform: config.platform,
      language: config.language,
      audience: config.audience,
      length: config.length,
      creativity: config.creativity,
      formality: config.formality,
      modelId: options.modelId,
      userId: options.userId,
      plan: plan?.tier,
    });

    return result;
  }
}

export const toolService = new ToolService();
