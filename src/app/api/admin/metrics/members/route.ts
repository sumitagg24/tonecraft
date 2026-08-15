import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdmin } from "@/lib/admin-metrics";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const admin = await requireWorkspaceAdmin(ctx);
  if (!admin.ok) return admin.error;
  const { workspaceId } = admin.scope;

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
