import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const messageId = ctx.request.nextUrl.searchParams.get("messageId") || undefined;
  const chatId = ctx.request.nextUrl.searchParams.get("chatId") || undefined;

  const where: Record<string, unknown> = { userId: ctx.user.id };
  if (messageId) where.messageId = messageId;
  if (chatId) where.chatId = chatId;

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true, image: true } } },
  });

  return ok({ comments });
});

export const POST = api.POST(async (ctx, body) => {
  const { messageId, content } = (body ?? {}) as {
    messageId?: string;
    content?: string;
  };

  if (!messageId) return fail("BAD_REQUEST", "messageId is required", 400);
  if (!content || !content.trim()) return fail("BAD_REQUEST", "Content is required", 400);

  const comment = await prisma.comment.create({
    data: {
      userId: ctx.user.id,
      messageId,
      content: content.trim(),
    },
    include: { user: { select: { name: true, image: true } } },
  });

  return ok(comment, 201);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id, content } = body as { id: string; content: string };

  const comment = await prisma.comment.findFirst({
    where: { id, userId: ctx.user.id },
  });
  if (!comment) return notFound();

  const updated = await prisma.comment.update({
    where: { id },
    data: { content: content.trim(), updatedAt: new Date() },
  });

  return ok(updated);
});

export const DELETE = api.DELETE(async (ctx) => {
  const id = ctx.request.nextUrl.searchParams.get("id");
  if (!id) return fail("BAD_REQUEST", "id is required", 400);

  const comment = await prisma.comment.findFirst({
    where: { id, userId: ctx.user.id },
  });
  if (!comment) return notFound();

  await prisma.comment.delete({ where: { id } });
  return ok({ ok: true });
});
