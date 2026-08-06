import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { workspaceService } from "@/services/WorkspaceService";
import { prisma } from "@/lib/prisma";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const type = ctx.request.nextUrl.searchParams.get("type") as "members" | "projects" | "activity" | "tokens" | null;
  
  const isMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: id, userId: ctx.user.id } },
  });
  
  if (!isMember) return fail("FORBIDDEN", "You are not a member of this workspace", 403);
  
  switch (type) {
    case "members":
      return ok(await prisma.workspaceMember.count({
        where: { workspaceId: id },
      }));
      
    case "projects":
      return ok(await prisma.project.count({
        where: { workspaceId: id },
      }));
      
    case "activity":
      return ok(await prisma.activityFeed.count({
        where: { workspaceId: id },
      }));
      
    case "tokens": {
      const usage = await prisma.usage.findUnique({
        where: { userId: ctx.user.id },
      });
      return ok(usage || { messagesSent: 0, tokensUsed: 0, filesUploaded: 0 });
    }
      
    default:
      return ok({
        members: await prisma.workspaceMember.count({ where: { workspaceId: id } }),
        projects: await prisma.project.count({ where: { workspaceId: id } }),
        activity: await prisma.activityFeed.count({ where: { workspaceId: id } }),
        tokens: await prisma.usage.findUnique({ where: { userId: ctx.user.id } }),
      });
  }
});