import { ok, withApiHandler } from "@/lib/withApiHandler";
import { calendarService } from "@/services/CalendarService";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().nullable().optional(),
  allDay: z.boolean().optional(),
  color: z.string().max(20).optional(),
});

const api = withApiHandler({ schema: createSchema });

export const GET = api.GET(async (ctx) => {
  const from = ctx.request.nextUrl.searchParams.get("from");
  const to = ctx.request.nextUrl.searchParams.get("to");
  const events = await calendarService.list(
    ctx.user.id,
    from ? new Date(from) : undefined,
    to ? new Date(to) : undefined
  );
  return ok(events);
});

export const POST = api.POST(async (ctx, body) => {
  const data = body as typeof createSchema._output;
  const event = await calendarService.create(ctx.user.id, data);
  return ok(event, 201);
});
