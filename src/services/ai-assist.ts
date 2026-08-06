import { aiEngine } from "@/engine/AIEngine";
import { planService } from "@/services/PlanService";
import type { Intent, Tone } from "@/engine/types";

/**
 * Shared AI runner for Phase 10 features (agents, automations, AI assist).
 * Mirrors ToolService: resolves plan → calls aiEngine.generate → returns result.
 */
export async function runAi(
  prompt: string,
  userId: string,
  opts?: { role?: string; intent?: Intent; tone?: Tone }
) {
  const plan = await planService.getPlan(userId);
  const result = await aiEngine.generate({
    intent: opts?.intent ?? "custom",
    prompt,
    tone: opts?.tone,
    persona: opts?.role ? { name: "Assistant", systemPrompt: opts.role } : undefined,
    userId,
    plan: plan.tier,
  });
  return {
    content: result.content,
    model: result.model,
    provider: result.provider,
    tokens: result.tokens,
    latency: result.latency,
  };
}
