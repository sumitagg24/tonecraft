import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { toolService } from "@/services/ToolService";
import { planService } from "@/services/PlanService";
import { logger } from "@/lib/logger";
import { z } from "zod";

/**
 * Debug tool runner — auth-required, tightly rate-limited. The userId always
 * comes from the Clerk session (never the request body), so callers cannot
 * impersonate another account or burn LLM credits anonymously.
 */
const schema = z.object({
  toolId: z.string().min(1).max(64),
  input: z.string().min(1).max(10_000, "Input is too long"),
  tone: z.string().max(64).optional(),
  length: z.string().max(32).optional(),
  creativity: z.number().min(0).max(100).optional(),
});

const api = withApiHandler({
  schema,
  rateLimit: { key: "debug", limit: 5, ipLimit: 10 },
});

export const POST = api.POST(async (ctx, body) => {
  const b = body as z.infer<typeof schema>;
  try {
    const plan = await planService.getPlan(ctx.user.id);
    const result = await toolService.execute({
      toolId: b.toolId,
      input: b.input,
      tone: b.tone,
      length: b.length,
      creativity: b.creativity,
      userId: ctx.user.id,
    });
    return ok({
      plan: plan.tier,
      model: result.model,
      content: result.content.slice(0, 200),
      metadata: result.metadata,
    });
  } catch {
    // Log the full detail server-side; never surface internal error text to
    // the caller.
    logger.error("[/api/__debug__] Tool execution failed", { userId: ctx.user.id, toolId: b.toolId });
    return fail("DEBUG_FAILED", "Tool execution failed", 500);
  }
});
