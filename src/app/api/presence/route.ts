import { fail, ok, withApiHandler } from "@/lib/withApiHandler";
import { collaborationService } from "@/services/CollaborationService";
import { canAccessProject, canAccessChat } from "@/lib/resource-access";
import { z } from "zod";

// userId is NOT accepted from the client — presence is always written for the
// authenticated user (a client-claimed userId previously let anyone spoof
// presence as another user in another user's project/chat).
const updateSchema = z.object({
  projectId: z.string().optional(),
  chatId: z.string().optional(),
  status: z.string().optional(),
  cursorX: z.number().optional(),
  cursorY: z.number().optional(),
  selectionStart: z.number().optional(),
  selectionEnd: z.number().optional(),
  currentPath: z.string().optional(),
});

const api = withApiHandler({ schema: updateSchema });

export const POST = api.POST(async (ctx, body) => {
  const b = body as z.infer<typeof updateSchema>;
  // Authorization: only write presence for projects/chats the caller can access.
  if (b.projectId && !(await canAccessProject(ctx.user.id, b.projectId))) {
    return fail("NOT_FOUND", "Project not found", 404);
  }
  if (b.chatId && !(await canAccessChat(ctx.user.id, b.chatId))) {
    return fail("NOT_FOUND", "Chat not found", 404);
  }
  const presence = await collaborationService.updatePresence({
    ...b,
    userId: ctx.user.id,
  });
  return ok(presence);
});

export const GET = api.GET(async (ctx) => {
  const sp = ctx.request.nextUrl.searchParams;
  const projectId = sp.get("projectId") ?? undefined;
  const chatId = sp.get("chatId") ?? undefined;
  if (projectId) {
    if (!(await canAccessProject(ctx.user.id, projectId))) {
      return fail("NOT_FOUND", "Project not found", 404);
    }
    const presences = await collaborationService.getProjectPresences(projectId);
    return ok({ presences });
  }
  if (chatId) {
    if (!(await canAccessChat(ctx.user.id, chatId))) {
      return fail("NOT_FOUND", "Chat not found", 404);
    }
    const presences = await collaborationService.getChatPresences(chatId);
    return ok({ presences });
  }
  return ok({ presences: [] });
});
