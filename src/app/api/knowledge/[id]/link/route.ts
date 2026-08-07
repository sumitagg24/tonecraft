import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { knowledgeService } from "@/services/KnowledgeService";
import { auditLogService } from "@/services/AuditLogService";

const api = withApiHandler();

export const POST = api.POST(async (ctx, body) => {
  const { id } = ctx.params;
  const { messageId, chatId } = (body as { messageId?: string; chatId?: string }) ?? {};

  const file = await prisma.knowledgeFile.findFirst({
    where: { id, userId: ctx.user.id },
  });
  if (!file) return notFound();

  let targetMessageId = messageId;

  // If chatId is passed, find the last message in that chat or create/link to chat
  if (!targetMessageId && chatId) {
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: ctx.user.id },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!chat) return fail("NOT_FOUND", "Chat not found", 404);
    if (chat.messages.length > 0) {
      targetMessageId = chat.messages[0].id;
    } else {
      // Create initial message placeholder if needed
      const msg = await prisma.message.create({
        data: {
          chatId: chat.id,
          role: "user",
          content: "[Knowledge base document linked]",
        },
      });
      targetMessageId = msg.id;
    }
  }

  if (!targetMessageId) {
    return fail("BAD_REQUEST", "messageId or chatId is required", 400);
  }

  await knowledgeService.linkToMessage(targetMessageId, [id]);

  void auditLogService.record("knowledge.index_complete", "knowledge_file", {
    actorId: ctx.user.id,
    resourceId: id,
    metadata: { action: "linked", messageId: targetMessageId, fileName: file.name },
  });

  return ok({ linked: true, fileId: id, messageId: targetMessageId });
});
