import { prisma } from "@/lib/prisma";
import type { TaskStatus, TaskPriority } from "@prisma/client";

export class TaskService {
  async list(userId: string, status?: TaskStatus) {
    return prisma.task.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
  }

  async get(id: string, userId: string) {
    return prisma.task.findFirst({ where: { id, userId } });
  }

  async create(userId: string, data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date | null;
  }) {
    const count = await prisma.task.count({ where: { userId, status: data.status ?? "todo" } });
    return prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? "todo",
        priority: data.priority ?? "medium",
        dueDate: data.dueDate ?? null,
        position: count,
      },
    });
  }

  async update(id: string, userId: string, data: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date | null;
    position?: number;
  }) {
    return prisma.task.updateMany({ where: { id, userId }, data });
  }

  async remove(id: string, userId: string) {
    return prisma.task.deleteMany({ where: { id, userId } });
  }
}

export const taskService = new TaskService();
