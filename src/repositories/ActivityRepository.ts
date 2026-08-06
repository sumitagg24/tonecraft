import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const activitySelect = {
  id: true,
  userId: true,
  projectId: true,
  chatId: true,
  type: true,
  title: true,
  description: true,
  metadata: true,
  createdAt: true,
  user: { select: { id: true, name: true, image: true } },
} as const;

export class ActivityRepository {
  async create(data: {
    userId: string;
    projectId?: string;
    chatId?: string;
    type: string;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.activity.create({
      data: {
        ...data,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
      select: activitySelect,
    });
  }

  async findByProject(projectId: string, page = 1, perPage = 20) {
    return prisma.activity.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: activitySelect,
    });
  }

  async findByChat(chatId: string, page = 1, perPage = 20) {
    return prisma.activity.findMany({
      where: { chatId },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: activitySelect,
    });
  }

  async findByUser(userId: string, page = 1, perPage = 20) {
    return prisma.activity.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: activitySelect,
    });
  }

  async findByType(type: string, page = 1, perPage = 20) {
    return prisma.activity.findMany({
      where: { type },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: activitySelect,
    });
  }

  async countByProject(projectId: string) {
    return prisma.activity.count({ where: { projectId } });
  }

  async countByChat(chatId: string) {
    return prisma.activity.count({ where: { chatId } });
  }

  async countByUser(userId: string) {
    return prisma.activity.count({ where: { userId } });
  }

  async countByType(type: string) {
    return prisma.activity.count({ where: { type } });
  }

  async aggregateByProject(projectId: string) {
    const byType = await prisma.activity.groupBy({
      by: ["type"],
      where: { projectId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
    const total = await prisma.activity.count({ where: { projectId } });
    return { byType, total };
  }

  async aggregateByUser(userId: string) {
    const byType = await prisma.activity.groupBy({
      by: ["type"],
      where: { userId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
    const total = await prisma.activity.count({ where: { userId } });
    return { byType, total };
  }
}

export const activityRepository = new ActivityRepository();