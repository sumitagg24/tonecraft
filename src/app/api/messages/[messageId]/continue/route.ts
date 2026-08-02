import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { messageService } from "@/services/MessageService";
import { planService } from "@/services/PlanService";
import { checkMessageLimit } from "@/lib/ratelimit";

const api = withApiHandler();

export const POST = api.POST(async (ctx) => {
  const { messageId } = ctx.params;
  try {
    // Continue is LLM-costly — same caps as new messages (audit 12 P0.3).
    const plan = await planService.getPlan(ctx.user.id);
    const limit = await checkMessageLimit(ctx.user.id, plan.tier);
    if (!limit.allowed) {
      return fail("RATE_LIMITED", "Rate limit exceeded", 429, {
        limit: limit.limit,
        window: limit.window,
        remaining: limit.remaining,
      });
    }

    const message = await messageService.continueMessage(messageId, ctx.user.id);
    return ok(message);
  } catch (error) {
    return fail(
      "REQUEST_FAILED",
      error instanceof Error ? error.message : "Failed to continue",
      400
    );
  }
});
