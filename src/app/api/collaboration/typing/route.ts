import { fail, ok, withApiHandler } from "@/lib/withApiHandler";
import { collaborationService } from "@/services/CollaborationService";
import { canAccessChat } from "@/lib/resource-access";
import { z } from "zod";

// NOTE: userId is intentionally NOT accepted from the client — the typing
// indicator is always written for the authenticated user (a client-claimed
// userId previously let anyone spoof typing as another user in another user's
// chat).
const typingSchema = z.object({
  chatId: z.string(),
  isTyping: z.boolean(),
});

const api = withApiHandler({ schema: typingSchema });

export const POST = api.POST(async (ctx, body) => {
  const typedBody = body as z.infer<typeof typingSchema>;
  // Authorization: only write typing state for chats the caller can access.
  if (!(await canAccessChat(ctx.user.id, typedBody.chatId))) {
    return fail("NOT_FOUND", "Chat not found", 404);
  }
  await collaborationService.setTyping(ctx.user.id, typedBody.chatId, typedBody.isTyping);
  return ok({ success: true });
});

export const GET = api.GET(async (ctx) => {
  const chatId = ctx.request.nextUrl.searchParams.get("chatId");
  if (!chatId) return fail("VALIDATION_ERROR", "chatId is required", 400);
  if (!(await canAccessChat(ctx.user.id, chatId))) {
    return fail("NOT_FOUND", "Chat not found", 404);
  }
  const users = await collaborationService.getChatTypingUsers(chatId);
  return ok({ users });
});
