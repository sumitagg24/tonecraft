import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { workspaceRepository } from "@/repositories/WorkspaceRepository";
import { workspaceActivityRepository } from "@/repositories/WorkspaceActivityRepository";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";
import { prisma } from "@/lib/prisma";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const includeArchived = ctx.request.nextUrl.searchParams.get("includeArchived");

  const isMember = await permissionMiddleware.isWorkspaceMember(id, ctx.user.id);
  if (!isMember) return fail("FORBIDDEN", "You are not a member of this workspace", 403);

  const projects = await workspaceRepository.listProjects(
    id,
    includeArchived === "true",
  );

  return ok(projects);
});

export const POST = api.POST(async (ctx, body) => {
  const { id } = ctx.params;
  const { name, description, color, emoji, parentId } = body as {
    name: string;
    description?: string;
    color?: string;
    emoji?: string;
    parentId?: string;
  };

  const check = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "manager");
  if (check === "none") return fail("FORBIDDEN", "You must be a manager or admin to create projects", 403);

  const project = await prisma.project.create({
    data: {
      userId: ctx.user.id,
      workspaceId: id,
      name,
      description,
      color,
      emoji,
      parentId,
    },
  });

  await workspaceActivityRepository.create({
    workspaceId: id,
    userId: ctx.user.id,
    type: "project_create",
    payload: { projectId: project.id, name },
  });

  return ok(project, 201);
});