import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const workspaceId = ctx.request.nextUrl.searchParams.get("workspaceId");

  if (!workspaceId) {
    return fail("BAD_REQUEST", "workspaceId is required", 400);
  }

  const role = await permissionMiddleware.checkWorkspaceRole(workspaceId, ctx.user.id, "admin");
  if (role !== "admin") return fail("FORBIDDEN", "Admin access required", 403);

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      },
    },
  });

  const roleDistribution = members.reduce(
    (acc: Record<string, number>, m) => {
      acc[m.role] = (acc[m.role] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return ok({
    total: members.length,
    roleDistribution,
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.createdAt,
      user: m.user,
    })),
  });
});
