import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class VersionSnapshotRepository {
  async create(data: {
    resourceType: string;
    resourceId: string;
    userId: string;
    version: number;
    title?: string;
    content: Record<string, unknown>;
    diff?: Record<string, unknown>;
    changeType: string;
    changeSummary?: string;
    sizeBytes: number;
    isAuto: boolean;
    parentId?: string;
  }) {
    return prisma.versionSnapshot.create({
      data: {
        ...data,
        content: data.content as Prisma.InputJsonValue,
        diff: data.diff as Prisma.InputJsonValue,
      },
    });
  }

  async findLatest(resourceType: string, resourceId: string) {
    return prisma.versionSnapshot.findFirst({
      where: { resourceType, resourceId },
      orderBy: { version: "desc" },
    });
  }

  async findByResource(resourceType: string, resourceId: string, page = 1, perPage = 20) {
    return prisma.versionSnapshot.findMany({
      where: { resourceType, resourceId },
      orderBy: { version: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    });
  }

  async findById(id: string) {
    return prisma.versionSnapshot.findUnique({ where: { id } });
  }

  async restore(id: string) {
    const snapshot = await prisma.versionSnapshot.findUnique({ where: { id } });
    if (!snapshot) return null;
    return {
      content: snapshot.content,
      version: snapshot.version,
      changeType: snapshot.changeType,
      changeSummary: snapshot.changeSummary,
    };
  }

  async diff(id: string) {
    const snapshot = await prisma.versionSnapshot.findUnique({
      where: { id },
      include: { parent: true },
    });
    if (!snapshot || !snapshot.parent) return null;
    return {
      base: snapshot.parent.content,
      target: snapshot.content,
      diff: snapshot.diff,
      changeType: snapshot.changeType,
      changeSummary: snapshot.changeSummary,
    };
  }

  async countByResource(resourceType: string, resourceId: string) {
    return prisma.versionSnapshot.count({ where: { resourceType, resourceId } });
  }

  async getVersionChain(resourceType: string, resourceId: string) {
    return prisma.versionSnapshot.findMany({
      where: { resourceType, resourceId },
      orderBy: { version: "asc" },
      select: {
        id: true,
        version: true,
        title: true,
        changeType: true,
        changeSummary: true,
        sizeBytes: true,
        isAuto: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async deleteOldAutoSnapshots(resourceType: string, resourceId: string, keepCount = 10) {
    const snapshots = await prisma.versionSnapshot.findMany({
      where: { resourceType, resourceId, isAuto: true },
      orderBy: { version: "desc" },
      skip: keepCount,
    });
    if (snapshots.length === 0) return 0;
    const ids = snapshots.map((s) => s.id);
    await prisma.versionSnapshot.deleteMany({ where: { id: { in: ids } } });
    return ids.length;
  }

  async getStorageStats(resourceType?: string) {
    const where = resourceType ? { resourceType } : {};
    const result = await prisma.versionSnapshot.aggregate({
      where,
      _sum: { sizeBytes: true },
      _count: { id: true },
    });
    return {
      totalSnapshots: result._count.id,
      totalSizeBytes: result._sum.sizeBytes ?? 0,
    };
  }
}

export const versionSnapshotRepository = new VersionSnapshotRepository();