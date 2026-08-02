import { ok, withApiHandler } from "@/lib/withApiHandler";
import { projectService } from "@/services/ProjectService";
import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const EMOJI_RE = /^[\p{Emoji}\p{Emoji_Presentation}\s]{0,10}$/u;

const projectSchema = z.object({
  name: z.string().min(1).max(80),
  emoji: z.string().refine((v) => !v || EMOJI_RE.test(v), "Emoji must be a single emoji or empty").optional(),
  color: z.string().refine((v) => !v || HEX_COLOR.test(v), "Color must be a valid hex color").optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
});

const api = withApiHandler({ schema: projectSchema });

export const GET = api.GET(async (ctx) => {
  const includeArchived = false;
  const projects = await projectService.listProjects(ctx.user.id, includeArchived);
  const unfiled = await projectService.getUnfiledCount(ctx.user.id);
  return ok({ projects, unfiled });
});

export const POST = api.POST(async (ctx, body) => {
  const project = await projectService.createProject(ctx.user.id, body as typeof projectSchema._output);
  return ok(project, 201);
});
