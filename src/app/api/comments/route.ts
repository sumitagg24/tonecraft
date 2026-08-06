import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/services/NotificationService";
import { auditLogService } from "@/services/AuditLogService";

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

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { chat: { select: { userId: true, id: true } } },
  });
  if (!message) return notFound();

  const comment = await prisma.comment.create({
    data: {
      userId: ctx.user.id,
      messageId,
      content: content.trim(),
    },
    include: { user: { select: { name: true, image: true } } },
  });

  // Audit: comment created
  void auditLogService.record("knowledge.upload", "comment", {
    actorId: ctx.user.id,
    resourceId: comment.id,
    metadata: { messageId, chatId: message.chat.id },
  });

  // Notify message owner if commenter is not the owner
  if (message.chat.userId !== ctx.user.id) {
    void notificationService.createComment(
      ctx.user.id,
      message.chat.userId,
      "comment",
      messageId,
      content.trim(),
      `/chat/${message.chat.id}`
    );
  }

  // Notify mentioned users (pattern: @userId or @email)
  const mentionRegex = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|@([a-zA-Z0-9_]+)/g;
  const mentioned = new Set<string>();
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    const identifier = match[1] || match[2];
    if (!identifier || identifier === ctx.user.id) continue;

    if (match[1]) {
      // Email match
      const user = await prisma.user.findUnique({
        where: { email: match[1] },
        select: { id: true },
      });
      if (user) mentioned.add(user.id);
    }
  }

  for (const mentionedUserId of mentioned) {
    void notificationService.createMention(
      ctx.user.id,
      mentionedUserId,
      "comment",
      comment.id,
      content.trim(),
      `/chat/${message.chat.id}`
    );
  }

  return ok(comment, 201);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id, content } = body as { id: string; content: string };

  const comment = await prisma.comment.findFirst({
    where: { id, userId: ctx.user.id },
  });
  if (!comment) return notFound();

  await prisma.comment.update({
    where: { id },
    data: { content: content.trim(), updatedAt: new Date() },
  });

  void auditLogService.record("prompt.update", "comment", {
    actorId: ctx.user.id,
    resourceId: id,
    metadata: { action: "edited" },
  });

  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const id = ctx.request.nextUrl.searchParams.get("id");
  if (!id) return fail("BAD_REQUEST", "id is required", 400);

  const comment = await prisma.comment.findFirst({
    where: { id, userId: ctx.user.id },
  });
  if (!comment) return notFound();

  await prisma.comment.delete({ where: { id } });

  void auditLogService.record("knowledge.delete", "comment", {
    actorId: ctx.user.id,
    resourceId: id,
  });

  return ok({ ok: true });
});
