import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { automationService } from "@/services/AutomationService";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
  trigger: z.enum(["daily", "weekly", "custom"]).optional(),
  cron: z.string().max(60).nullable().optional(),
  prompt: z.string().min(1).max(10000).optional(),
  enabled: z.boolean().optional(),
});

const api = withApiHandler({ schema: updateSchema });

export const GET = api.GET(async (ctx) => {
  const automation = await automationService.get(ctx.params.id, ctx.user.id);
  if (!automation) return notFound();
  return ok(automation);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const data = body as typeof updateSchema._output;
  const { count } = await automationService.update(ctx.params.id, ctx.user.id, data);
  if (count === 0) return notFound();
  const updated = await automationService.get(ctx.params.id, ctx.user.id);
  return ok(updated);
});

export const DELETE = api.DELETE(async (ctx) => {
  const { count } = await automationService.remove(ctx.params.id, ctx.user.id);
  if (count === 0) return notFound();
  return ok({ ok: true });
});
