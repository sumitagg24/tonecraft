import { ok, withApiHandler } from "@/lib/withApiHandler";
import { planService } from "@/services/PlanService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const plan = await planService.getPlan(ctx.user.id);
  return ok({
    plan: plan.tier,
    label: plan.label,
    status: plan.tier === "free" ? "free" : "active",
  });
});
