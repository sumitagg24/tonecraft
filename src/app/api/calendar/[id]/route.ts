import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { calendarService } from "@/services/CalendarService";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).nullable().optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().nullable().optional(),
  allDay: z.boolean().optional(),
  color: z.string().max(20).optional(),
});

const api = withApiHandler({ schema: updateSchema });

export const GET = api.GET(async (ctx) => {
  const event = await calendarService.get(ctx.params.id, ctx.user.id);
  if (!event) return notFound();
  return ok(event);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const data = body as typeof updateSchema._output;
  const { count } = await calendarService.update(ctx.params.id, ctx.user.id, data);
  if (count === 0) return notFound();
  const updated = await calendarService.get(ctx.params.id, ctx.user.id);
  return ok(updated);
});

export const DELETE = api.DELETE(async (ctx) => {
  const { count } = await calendarService.remove(ctx.params.id, ctx.user.id);
  if (count === 0) return notFound();
  return ok({ ok: true });
});
