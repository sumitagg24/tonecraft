import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class DocumentOperationRepository {
  async create(data: {
    resourceType: string;
    resourceId: string;
    userId: string;
    version: number;
    operation: Record<string, unknown>;
    baseVersion: number;
  }) {
    return prisma.documentOperation.create({
      data: {
        ...data,
        operation: data.operation as Prisma.InputJsonValue,
      },
    });
  }

  async findPending(resourceType: string, resourceId: string, baseVersion: number) {
    return prisma.documentOperation.findMany({
      where: {
        resourceType,
        resourceId,
        baseVersion,
        applied: false,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async markApplied(id: string) {
    return prisma.documentOperation.update({
      where: { id },
      data: { applied: true },
    });
  }

  async findByResource(resourceType: string, resourceId: string, page = 1, perPage = 50) {
    return prisma.documentOperation.findMany({
      where: { resourceType, resourceId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async getLatestVersion(resourceType: string, resourceId: string) {
    const op = await prisma.documentOperation.findFirst({
      where: { resourceType, resourceId },
      orderBy: { version: "desc" },
    });
    return op?.version ?? 0;
  }

  async pruneOld(resourceType: string, resourceId: string, keepCount = 100) {
    const ops = await prisma.documentOperation.findMany({
      where: { resourceType, resourceId },
      orderBy: { version: "desc" },
      skip: keepCount,
    });
    if (ops.length === 0) return 0;
    const ids = ops.map((o) => o.id);
    await prisma.documentOperation.deleteMany({ where: { id: { in: ids } } });
    return ids.length;
  }
}

export const documentOperationRepository = new DocumentOperationRepository();