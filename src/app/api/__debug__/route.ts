import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { toolService } from "@/services/ToolService";
import { planService } from "@/services/PlanService";
import { z } from "zod";

const schema = z.object({
  userId: z.string(),
  toolId: z.string(),
  input: z.string(),
  tone: z.string().optional(),
  length: z.string().optional(),
  creativity: z.number().optional(),
});

const api = withApiHandler({ schema, auth: false });

export const POST = api.POST(async (_ctx, body) => {
  const b = body as z.infer<typeof schema>;
  try {
    const plan = await planService.getPlan(b.userId);
    const result = await toolService.execute({
      toolId: b.toolId,
      input: b.input,
      tone: b.tone,
      length: b.length,
      creativity: b.creativity,
      userId: b.userId,
    });
    return ok({ plan: plan.tier, model: result.model, content: result.content.slice(0, 200), metadata: result.metadata });
  } catch (e) {
    return fail("DEBUG", e instanceof Error ? `${e.name}: ${e.message}` : String(e), 500);
  }
});
