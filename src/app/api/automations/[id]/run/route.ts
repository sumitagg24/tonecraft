import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { automationService } from "@/services/AutomationService";
import { planService } from "@/services/PlanService";
import { checkMessageLimit } from "@/lib/ratelimit";

const api = withApiHandler();

export const POST = api.POST(async (ctx) => {
  const automation = await automationService.get(ctx.params.id, ctx.user.id);
  if (!automation) return notFound();

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
    const result = await automationService.runNow(ctx.params.id, ctx.user.id);
    return ok(result);
  } catch (error) {
    return fail(
      "AUTOMATION_RUN_FAILED",
      error instanceof Error ? error.message : "Automation run failed",
      400
    );
  }
});
