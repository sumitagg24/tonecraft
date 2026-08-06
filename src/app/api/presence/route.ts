import { ok, withApiHandler } from "@/lib/withApiHandler";
import { collaborationService } from "@/services/CollaborationService";
import { z } from "zod";

const updateSchema = z.object({
  userId: z.string(),
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
  const presence = await collaborationService.updatePresence(body as Parameters<typeof collaborationService.updatePresence>[0]);
  return ok(presence);
});

export const GET = api.GET(async (ctx, body) => {
  const { projectId, chatId } = body as { projectId?: string; chatId?: string };
  if (projectId) {
    const presences = await collaborationService.getProjectPresences(projectId);
    return ok({ presences });
  }
  if (chatId) {
    const presences = await collaborationService.getChatPresences(chatId);
    return ok({ presences });
  }
  return ok({ presences: [] });
});