import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { chatService } from "@/services/ChatService";
import { projectService } from "@/services/ProjectService";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  tone: z.string().optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  projectId: z.string().nullable().optional(),
});

const api = withApiHandler({ schema: updateSchema });

export const GET = api.GET(async (ctx) => {
  const { chatId } = ctx.params;
  const chat = await chatService.getChat(chatId, ctx.user.id);
  if (!chat) return notFound();
  return ok(chat);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { chatId } = ctx.params;
  const data = body as typeof updateSchema._output;
  const { projectId, ...rest } = data;
  if ("projectId" in data && data.projectId !== undefined) {
    try {
      await projectService.moveChat(chatId, ctx.user.id, projectId ?? null);
    } catch (e) {
      // Only a missing project is a client error; anything else is a real
      // failure and must reach withApiHandler (logged + reported to Sentry).
      if (e instanceof Error && e.message === "Project not found") {
        return fail("NOT_FOUND", e.message, 404);
      }
      throw e;
    }
  }
  if (Object.keys(rest).length > 0) {
    const updated = await chatService.updateChat(chatId, ctx.user.id, rest);
    if (!updated) return notFound();
  }
  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const { chatId } = ctx.params;
  await chatService.deleteChat(chatId, ctx.user.id);
  return ok({ ok: true });
});
