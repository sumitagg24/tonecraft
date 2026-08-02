import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { knowledgeService } from "@/services/KnowledgeService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const file = await knowledgeService.findByIdAndUser(id, ctx.user.id);
  if (!file) return notFound();
  return ok(file);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id } = ctx.params;
  const name = (body as { name?: string }).name;
  if (!name || !name.trim()) return fail("BAD_REQUEST", "Name is required", 400);
  await knowledgeService.rename(id, ctx.user.id, name.trim());
  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const { id } = ctx.params;
  await prisma.knowledgeChunk.deleteMany({ where: { file: { id, userId: ctx.user.id } } });
  const removed = await knowledgeService.remove(id, ctx.user.id);
  if (removed.count === 0) return notFound();
  return ok({ ok: true });
});
