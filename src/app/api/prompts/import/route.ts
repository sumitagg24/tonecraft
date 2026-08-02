import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { promptRepository } from "@/repositories/PromptRepository";
import { planService } from "@/services/PlanService";
import { checkMessageLimit } from "@/lib/ratelimit";
import { promptImportSchema } from "@/lib/validators";

const api = withApiHandler({ schema: promptImportSchema });

export const POST = api.POST(async (ctx, body) => {
  const { prompts } = body as typeof promptImportSchema._output;

  // Import can create up to 500 rows — throttle it (audit 12 P1.8).
  const plan = await planService.getPlan(ctx.user.id);
  const limit = await checkMessageLimit(ctx.user.id, plan.tier);
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Rate limit exceeded", 429, {
      limit: limit.limit,
      window: limit.window,
      remaining: limit.remaining,
    });
  }

  const created = [];
  for (const prompt of prompts) {
    created.push(await promptRepository.create({
      userId: ctx.user.id,
      title: prompt.title,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      variables: prompt.variables,
    }));
  }
  return ok({ imported: created.length }, 201);
});
