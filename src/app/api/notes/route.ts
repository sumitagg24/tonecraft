import { ok, withApiHandler } from "@/lib/withApiHandler";
import { noteService } from "@/services/NoteService";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(50000).optional(),
  color: z.string().max(20).optional(),
});

const api = withApiHandler({ schema: createSchema });

export const GET = api.GET(async (ctx) => {
  const notes = await noteService.list(ctx.user.id);
  return ok(notes);
});

export const POST = api.POST(async (ctx, body) => {
  const data = body as typeof createSchema._output;
  const note = await noteService.create(ctx.user.id, data);
  return ok(note, 201);
});
