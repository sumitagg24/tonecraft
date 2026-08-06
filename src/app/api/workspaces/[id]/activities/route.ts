import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { workspaceActivityRepository } from "@/repositories/WorkspaceActivityRepository";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const page = ctx.request.nextUrl.searchParams.get("page") || "1";
  const perPage = ctx.request.nextUrl.searchParams.get("perPage") || "50";
  
  const isMember = await permissionMiddleware.isWorkspaceMember(id, ctx.user.id);
  if (!isMember) return fail("FORBIDDEN", "You are not a member of this workspace", 403);
  
  const pageNum = parseInt(page) || 1;
  const perPageNum = parseInt(perPage) || 50;
  
  const activities = await workspaceActivityRepository.findByWorkspace(id, pageNum, perPageNum);
  return ok(activities);
});