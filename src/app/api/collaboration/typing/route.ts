import { fail, ok, withApiHandler } from "@/lib/withApiHandler";
import { collaborationService } from "@/services/CollaborationService";
import { z } from "zod";

const typingSchema = z.object({
  userId: z.string(),
  chatId: z.string(),
  isTyping: z.boolean(),
});

const api = withApiHandler({ schema: typingSchema });

export const POST = api.POST(async (ctx, body) => {
  const typedBody = body as z.infer<typeof typingSchema>;
  await collaborationService.setTyping(typedBody.userId, typedBody.chatId, typedBody.isTyping);
  return ok({ success: true });
});

export const GET = api.GET(async (ctx) => {
  const chatId = ctx.request.nextUrl.searchParams.get("chatId");
  if (!chatId) return fail("VALIDATION_ERROR", "chatId is required", 400);
  const users = await collaborationService.getChatTypingUsers(chatId);
  return ok({ users });
});