import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { workspaceService } from "@/services/WorkspaceService";
import { requireWorkspaceAdmin } from "@/lib/admin-metrics";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const admin = await requireWorkspaceAdmin(ctx);
  if (!admin.ok) return admin.error;
  const { workspaceId } = admin.scope;

  const projects = await workspaceService.getWorkspaceProjects(workspaceId, ctx.user.id);
  const projectIds = projects.map((p) => p.id);

  const [totalFiles, storageAgg, byType, recentFiles] = await Promise.all([
    prisma.knowledgeFile.count({ where: { projectId: { in: projectIds } } }),
    prisma.knowledgeFile.aggregate({
      _sum: { fileSize: true },
      where: { projectId: { in: projectIds } },
    }),
    prisma.knowledgeFile.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { fileSize: true },
      where: { projectId: { in: projectIds } },
    }),
    prisma.knowledgeFile.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        status: true,
        createdAt: true,
        projectId: true,
      },
    }),
  ]);

  return ok({
    totalFiles,
    totalBytes: storageAgg._sum.fileSize ?? 0,
    byStatus: byType.map((s) => ({ status: s.status, count: s._count.id, bytes: s._sum.fileSize ?? 0 })),
    recentFiles,
  });
});
