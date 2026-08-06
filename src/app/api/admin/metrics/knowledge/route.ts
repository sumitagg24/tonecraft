import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { workspaceService } from "@/services/WorkspaceService";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const workspaceId = ctx.request.nextUrl.searchParams.get("workspaceId");

  if (!workspaceId) {
    return fail("BAD_REQUEST", "workspaceId is required", 400);
  }

  const role = await permissionMiddleware.checkWorkspaceRole(workspaceId, ctx.user.id, "admin");
  if (role !== "admin") return fail("FORBIDDEN", "Admin access required", 403);

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
