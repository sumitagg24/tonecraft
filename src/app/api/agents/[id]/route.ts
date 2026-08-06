import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { agentService } from "@/services/AgentService";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
  role: z.string().max(4000).optional(),
  icon: z.string().max(8).optional(),
  color: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

const api = withApiHandler({ schema: updateSchema });

export const GET = api.GET(async (ctx) => {
  const agent = await agentService.get(ctx.params.id, ctx.user.id);
  if (!agent) return notFound();
  return ok(agent);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const data = body as typeof updateSchema._output;
  const { count } = await agentService.update(ctx.params.id, ctx.user.id, data);
  if (count === 0) return notFound();
  const updated = await agentService.get(ctx.params.id, ctx.user.id);
  return ok(updated);
});

export const DELETE = api.DELETE(async (ctx) => {
  const { count } = await agentService.remove(ctx.params.id, ctx.user.id);
  if (count === 0) return notFound();
  return ok({ ok: true });
});
