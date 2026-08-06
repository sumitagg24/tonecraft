import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { noteService } from "@/services/NoteService";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(50000).optional(),
  color: z.string().max(20).optional(),
  pinned: z.boolean().optional(),
});

const api = withApiHandler({ schema: updateSchema });

export const GET = api.GET(async (ctx) => {
  const note = await noteService.get(ctx.params.id, ctx.user.id);
  if (!note) return notFound();
  return ok(note);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const data = body as typeof updateSchema._output;
  const { count } = await noteService.update(ctx.params.id, ctx.user.id, data);
  if (count === 0) return notFound();
  const updated = await noteService.get(ctx.params.id, ctx.user.id);
  return ok(updated);
});

export const DELETE = api.DELETE(async (ctx) => {
  const { count } = await noteService.remove(ctx.params.id, ctx.user.id);
  if (count === 0) return notFound();
  return ok({ ok: true });
});
