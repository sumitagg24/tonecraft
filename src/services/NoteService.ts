import { prisma } from "@/lib/prisma";

export class NoteService {
  async list(userId: string) {
    return prisma.note.findMany({
      where: { userId },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });
  }

  async get(id: string, userId: string) {
    return prisma.note.findFirst({ where: { id, userId } });
  }

  async create(userId: string, data: { title?: string; content?: string; color?: string }) {
    return prisma.note.create({
      data: {
        userId,
        title: data.title?.trim() || "Untitled",
        content: data.content ?? "",
        color: data.color ?? "default",
      },
    });
  }

  async update(id: string, userId: string, data: {
    title?: string;
    content?: string;
    color?: string;
    pinned?: boolean;
  }) {
    return prisma.note.updateMany({ where: { id, userId }, data });
  }

  async remove(id: string, userId: string) {
    return prisma.note.deleteMany({ where: { id, userId } });
  }
}

export const noteService = new NoteService();
