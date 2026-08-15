import { fail, forbidden, ok, withApiHandler } from "@/lib/withApiHandler";
import { collaborationService } from "@/services/CollaborationService";
import { canAccessChat } from "@/lib/resource-access";
import { z } from "zod";

const typingSchema = z.object({
  chatId: z.string(),
  isTyping: z.boolean(),
});

const api = withApiHandler({ schema: typingSchema });

export const POST = api.POST(async (ctx, body) => {
  const typedBody = body as z.infer<typeof typingSchema>;
  if (!(await canAccessChat(typedBody.chatId, ctx.user.id))) return forbidden();
  await collaborationService.setTyping(ctx.user.id, typedBody.chatId, typedBody.isTyping);
  return ok({ success: true });
});

export const GET = api.GET(async (ctx) => {
  const chatId = ctx.request.nextUrl.searchParams.get("chatId");
  if (!chatId) return fail("VALIDATION_ERROR", "chatId is required", 400);
  if (!(await canAccessChat(chatId, ctx.user.id))) return forbidden();
  const users = await collaborationService.getChatTypingUsers(chatId);
  return ok({ users });
});
