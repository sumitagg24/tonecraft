import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { chatRepository } from "@/repositories/ChatRepository";
import { serializeChat, MIME_BY_FORMAT } from "@/lib/export/serialize";
import { notificationService } from "@/services/NotificationService";

const api = withApiHandler();

export const POST = api.POST(async (ctx, body) => {
  const { chatId, format } = (body ?? {}) as { chatId?: string; format?: string };
  const fmt = format ?? "md";

  if (!chatId) return fail("BAD_REQUEST", "chatId is required", 400);
  if (!MIME_BY_FORMAT[fmt]) {
    return fail("BAD_REQUEST", `Unsupported format: ${fmt}`, 400);
  }

  const chat = await chatRepository.findByIdAndUser(chatId, ctx.user.id);
  if (!chat) return notFound();

  const messages = chat.messages ?? [];
  const content = serializeChat(fmt, chat, messages);
  const filename = `${chat.title || "chat"}-${new Date().toISOString().slice(0, 10)}.${fmt}`;

  void notificationService.create(
    ctx.user.id,
    "export_completed",
    "Export ready",
    `"${chat.title || "Chat"}" exported as .${fmt}`,
    `/chat/${chatId}`
  );

  return ok({ content, filename, mime: MIME_BY_FORMAT[fmt] });
});
