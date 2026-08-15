import { forbidden, ok, withApiHandler } from "@/lib/withApiHandler";
import { collaborationService } from "@/services/CollaborationService";
import { canAccessChat, canAccessProject } from "@/lib/resource-access";
import { z } from "zod";

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
  const input = body as z.infer<typeof updateSchema>;
  // Presence is always recorded for the caller — the userId is never taken from
  // the request body, otherwise anyone could impersonate another user's cursor.
  if (input.projectId && !(await canAccessProject(input.projectId, ctx.user.id))) return forbidden();
  if (input.chatId && !(await canAccessChat(input.chatId, ctx.user.id))) return forbidden();

  const presence = await collaborationService.updatePresence({ ...input, userId: ctx.user.id });
  return ok(presence);
});

export const GET = api.GET(async (ctx) => {
  const sp = ctx.request.nextUrl.searchParams;
  const projectId = sp.get("projectId") ?? undefined;
  const chatId = sp.get("chatId") ?? undefined;
  if (projectId) {
    if (!(await canAccessProject(projectId, ctx.user.id))) return forbidden();
    const presences = await collaborationService.getProjectPresences(projectId);
    return ok({ presences });
  }
  if (chatId) {
    if (!(await canAccessChat(chatId, ctx.user.id))) return forbidden();
    const presences = await collaborationService.getChatPresences(chatId);
    return ok({ presences });
  }
  return ok({ presences: [] });
});
