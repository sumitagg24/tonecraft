import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { documentService } from "@/services/DocumentService";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(200000).optional(),
  emoji: z.string().max(8).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  pinned: z.boolean().optional(),
});

const api = withApiHandler({ schema: updateSchema });

export const GET = api.GET(async (ctx) => {
  const document = await documentService.get(ctx.params.id, ctx.user.id);
  if (!document) return notFound();
  return ok(document);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const data = body as typeof updateSchema._output;
  const { count } = await documentService.update(ctx.params.id, ctx.user.id, data);
  if (count === 0) return notFound();
  const updated = await documentService.get(ctx.params.id, ctx.user.id);
  return ok(updated);
});

export const DELETE = api.DELETE(async (ctx) => {
  const { count } = await documentService.remove(ctx.params.id, ctx.user.id);
  if (count === 0) return notFound();
  return ok({ ok: true });
});
