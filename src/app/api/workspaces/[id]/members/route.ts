import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { workspaceMemberRepository } from "@/repositories/WorkspaceMemberRepository";
import { workspaceActivityRepository } from "@/repositories/WorkspaceActivityRepository";
import { memberUpdateSchema } from "../../workspaceSchema";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;
  
  const isMember = await permissionMiddleware.isWorkspaceMember(id, ctx.user.id);
  if (!isMember) return fail("FORBIDDEN", "You are not a member of this workspace", 403);
  
  const members = await workspaceMemberRepository.findByWorkspace(id);
  return ok(members);
});

export const POST = api.POST(async (ctx, body) => {
  const { id } = ctx.params;
  const { role } = memberUpdateSchema.parse(body);
  
  const check = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "admin");
  if (check !== "admin") return fail("FORBIDDEN", "Only admins can add members directly", 403);
  
  // This route is for direct member addition (not invites)
  const { userId } = body as { userId: string };
  
  const member = await workspaceMemberRepository.create({ workspaceId: id, userId, role });
  
  await workspaceActivityRepository.create({
    workspaceId: id,
    userId: ctx.user.id,
    type: "members_status",
    payload: { action: "added", memberId: userId, role },
  });
  
  return ok(member, 201);
});