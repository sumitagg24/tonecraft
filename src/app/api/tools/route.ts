import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { toolService } from "@/services/ToolService";
import { planService } from "@/services/PlanService";
import { checkMessageLimit } from "@/lib/ratelimit";
import { z } from "zod";

const toolSchema = z.object({
  toolId: z.string(),
  input: z.string().min(1).max(10000),
  platform: z.string().optional(),
  language: z.string().optional(),
  tone: z.string().optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
  creativity: z.number().min(0).max(100).optional(),
  formality: z.enum(["casual", "neutral", "formal"]).optional(),
  audience: z.string().optional(),
  model: z.string().optional(),
});

// Phase 12.4 — per-endpoint (10/min) + IP ceiling (120/min) on top of the
// existing plan-based message caps.
const api = withApiHandler({ schema: toolSchema, rateLimit: { key: "tools", limit: 10, ipLimit: 120 } });

export const POST = api.POST(async (ctx, body) => {
  const { toolId, input, model, ...context } = body as typeof toolSchema._output;

  // Tool execution is LLM-costly — same caps as messages (audit 12 P0.3).
  const plan = await planService.getPlan(ctx.user.id);
  const limit = await checkMessageLimit(ctx.user.id, plan.tier);
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Rate limit exceeded", 429, {
      limit: limit.limit,
      window: limit.window,
      remaining: limit.remaining,
    });
  }

  const result = await toolService.execute({
    toolId,
    input,
    ...context,
    modelId: model,
    userId: ctx.user.id,
  });

  return ok({
    content: result.content,
    model: result.model,
    provider: result.provider,
    tokens: result.tokens,
    latency: result.latency,
    metadata: result.metadata,
  });
});
