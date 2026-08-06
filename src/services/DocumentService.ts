import { prisma } from "@/lib/prisma";

export class DocumentService {
  async list(userId: string, status?: string) {
    return prisma.document.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });
  }

  async get(id: string, userId: string) {
    return prisma.document.findFirst({ where: { id, userId } });
  }

  async create(userId: string, data: { title?: string; content?: string; emoji?: string }) {
    return prisma.document.create({
      data: {
        userId,
        title: data.title?.trim() || "Untitled",
        content: data.content ?? "",
        emoji: data.emoji,
      },
    });
  }

  async update(id: string, userId: string, data: {
    title?: string;
    content?: string;
    emoji?: string | null;
    status?: string;
    pinned?: boolean;
  }) {
    return prisma.document.updateMany({
      where: { id, userId },
      data,
    });
  }

  async remove(id: string, userId: string) {
    return prisma.document.deleteMany({ where: { id, userId } });
  }
}

export const documentService = new DocumentService();
