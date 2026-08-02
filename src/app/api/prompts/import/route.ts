import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { promptRepository } from "@/repositories/PromptRepository";
import { planService } from "@/services/PlanService";
import { checkMessageLimit } from "@/lib/ratelimit";
import { z } from "zod";

const importSchema = z.object({
  prompts: z.array(z.object({
    title: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    content: z.string().min(1).max(10000),
    category: z.string().max(50).optional(),
    variables: z.array(z.object({
      name: z.string().min(1).max(50),
      label: z.string().max(100).optional(),
      required: z.boolean().optional(),
      options: z.array(z.string().max(200)).max(50).optional(),
    })).max(50).optional(),
  })).min(1).max(500),
});

const api = withApiHandler({ schema: importSchema });

export const POST = api.POST(async (ctx, body) => {
  const { prompts } = body as typeof importSchema._output;

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
