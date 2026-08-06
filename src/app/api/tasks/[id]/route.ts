import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { taskService } from "@/services/TaskService";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  position: z.number().int().optional(),
});

const api = withApiHandler({ schema: updateSchema });

export const GET = api.GET(async (ctx) => {
  const task = await taskService.get(ctx.params.id, ctx.user.id);
  if (!task) return notFound();
  return ok(task);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const data = body as typeof updateSchema._output;
  const { count } = await taskService.update(ctx.params.id, ctx.user.id, data);
  if (count === 0) return notFound();
  const updated = await taskService.get(ctx.params.id, ctx.user.id);
  return ok(updated);
});

export const DELETE = api.DELETE(async (ctx) => {
  const { count } = await taskService.remove(ctx.params.id, ctx.user.id);
  if (count === 0) return notFound();
  return ok({ ok: true });
});
