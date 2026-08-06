import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { workspaceService } from "@/services/WorkspaceService";
import { prisma } from "@/lib/prisma";

const api = withApiHandler({
  schema: require("./workspaceSchema").workspaceCreateSchema,
});

export const GET = api.GET(async (ctx) => {
  const workspaces = await workspaceService.listWorkspaces(ctx.user.id);
  return ok(workspaces);
});

export const POST = api.POST(async (ctx, body) => {
  const { name, description, color, visibility, modes, settings } = body as {
    name: string;
    description?: string;
    color?: string;
    visibility?: "public" | "private" | "shared";
    modes?: string[];
    settings?: Record<string, unknown>;
  };
  
  const workspace = await workspaceService.createWorkspace(ctx.user.id, {
    name,
    description,
    color,
    visibility,
    modes,
    settings,
  });
  
  return ok(workspace, 201);
});