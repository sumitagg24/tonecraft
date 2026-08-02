import { ok, withApiHandler } from "@/lib/withApiHandler";
import { chatService } from "@/services/ChatService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const chats = await chatService.listChats(ctx.user.id);
  return ok(chats);
});

export const POST = api.POST(async (ctx, body) => {
  const data = (body ?? {}) as {
    title?: string;
    tone?: string;
    platform?: string;
    language?: string;
  };
  const chat = await chatService.createChat(ctx.user.id, data);
  return ok(chat, 201);
});
