import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { projectService } from "@/services/ProjectService";
import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const EMOJI_RE = /^[\p{Emoji}\p{Emoji_Presentation}\s]{0,10}$/u;

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  emoji: z.string().refine((v) => !v || EMOJI_RE.test(v), "Emoji must be a single emoji or empty").optional(),
  color: z.string().refine((v) => !v || HEX_COLOR.test(v), "Color must be a valid hex color").optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().nullable().optional(),
  archived: z.boolean().optional(),
});

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const project = await projectService.getProject(id, ctx.user.id);
  if (!project) return notFound();
  const chats = await projectService.listProjectChats(id, ctx.user.id);
  return ok({ project, chats });
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id } = ctx.params;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const okResult = await projectService.updateProject(id, ctx.user.id, parsed.data);
  if (!okResult) return notFound();
  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const { id } = ctx.params;
  const okResult = await projectService.deleteProject(id, ctx.user.id);
  if (!okResult) return notFound();
  return ok({ ok: true });
});
