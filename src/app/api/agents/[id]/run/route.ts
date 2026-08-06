import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { agentService } from "@/services/AgentService";
import { planService } from "@/services/PlanService";
import { checkMessageLimit } from "@/lib/ratelimit";
import { z } from "zod";

const runSchema = z.object({
  input: z.string().min(1).max(10000),
  chain: z.array(z.string()).max(5).optional(),
});

const api = withApiHandler({ schema: runSchema });

export const POST = api.POST(async (ctx, body) => {
  const agent = await agentService.get(ctx.params.id, ctx.user.id);
  if (!agent) return notFound();

  // Agent runs are LLM-costly — same caps as messages/tools.
  const plan = await planService.getPlan(ctx.user.id);
  const limit = await checkMessageLimit(ctx.user.id, plan.tier);
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Rate limit exceeded", 429, {
      limit: limit.limit,
      window: limit.window,
      remaining: limit.remaining,
    });
  }

  try {
    const data = body as typeof runSchema._output;
    const run = await agentService.run(ctx.params.id, ctx.user.id, data);
    return ok(run);
  } catch (error) {
    return fail("AGENT_RUN_FAILED", error instanceof Error ? error.message : "Agent run failed", 400);
  }
});
