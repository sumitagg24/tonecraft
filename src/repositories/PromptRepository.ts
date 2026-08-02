import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const promptSelect = {
  id: true,
  userId: true,
  title: true,
  description: true,
  content: true,
  category: true,
  variables: true,
  isFavorite: true,
  isArchived: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class PromptRepository {
  async findByUserId(userId: string, includeArchived = false, projectId?: string) {
    return prisma.prompt.findMany({
      where: {
        userId,
        isArchived: includeArchived ? undefined : false,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
      select: promptSelect,
    });
  }

  async findByIdAndUser(id: string, userId: string) {
    return prisma.prompt.findFirst({ where: { id, userId } });
  }

  async create(data: {
    userId: string;
    title: string;
    description?: string;
    content: string;
    category?: string;
    variables?: unknown;
    projectId?: string;
  }) {
    return prisma.prompt.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        content: data.content,
        category: data.category || "general",
        variables: data.variables as Prisma.InputJsonValue | undefined,
        projectId: data.projectId,
      },
      select: promptSelect,
    });
  }

  async update(id: string, userId: string, data: Partial<{
    title: string; description: string; content: string; category: string;
    variables: unknown; isFavorite: boolean; isArchived: boolean; projectId: string | null;
  }>) {
    const result = await prisma.prompt.updateMany({
      where: { id, userId },
      data: {
        ...data,
        variables: data.variables !== undefined
          ? (data.variables as Prisma.InputJsonValue)
          : undefined,
        updatedAt: new Date(),
      },
    });
    return result.count > 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await prisma.prompt.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async listCategories(userId: string): Promise<string[]> {
    const rows = await prisma.prompt.findMany({
      where: { userId, isArchived: false },
      select: { category: true },
      distinct: ["category"],
    });
    return rows.map((r) => r.category).sort();
  }

  async getFavorites(userId: string) {
    return prisma.prompt.findMany({
      where: { userId, isFavorite: true, isArchived: false },
      orderBy: { updatedAt: "desc" },
      select: promptSelect,
    });
  }
}

export const promptRepository = new PromptRepository();
