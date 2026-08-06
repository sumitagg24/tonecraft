import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const activitySelect = {
  id: true,
  workspaceId: true,
  userId: true,
  type: true,
  payload: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, image: true } },
} as const;

export class WorkspaceActivityRepository {
  async create(data: {
    workspaceId: string;
    userId: string;
    type: string;
    payload: Record<string, unknown>;
  }) {
    return prisma.activityFeed.create({
      data: {
        ...data,
        type: data.type as any,
        payload: data.payload as Prisma.InputJsonValue,
      },
      select: activitySelect,
    });
  }

  async findByWorkspace(workspaceId: string, page = 1, perPage = 50) {
    return prisma.activityFeed.findMany({
      where: { workspaceId },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: activitySelect,
    });
  }

  async findByUser(workspaceId: string, userId: string, page = 1, perPage = 50) {
    return prisma.activityFeed.findMany({
      where: { workspaceId, userId },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: activitySelect,
    });
  }

  async findByType(workspaceId: string, type: string, page = 1, perPage = 50) {
    return prisma.activityFeed.findMany({
      where: { workspaceId, type: type as any },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: activitySelect,
    });
  }

  async countByWorkspace(workspaceId: string) {
    return prisma.activityFeed.count({ where: { workspaceId } });
  }

  async getActivityStats(workspaceId: string, since?: Date) {
    const where: any = { workspaceId };
    if (since) where.createdAt = { gte: since };

    const byType = await prisma.activityFeed.groupBy({
      by: ["type"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const total = await prisma.activityFeed.count({ where });

    return { byType, total };
  }
}

export const workspaceActivityRepository = new WorkspaceActivityRepository();