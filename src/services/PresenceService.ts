import { prisma } from "@/lib/prisma";

export class PresenceService {
  async upsert(data: {
    userId: string;
    projectId?: string;
    chatId?: string;
    status?: string;
    cursorX?: number;
    cursorY?: number;
    selectionStart?: number;
    selectionEnd?: number;
    currentPath?: string;
  }) {
    const { userId, projectId, chatId, ...rest } = data;
    // Compound unique (userId, projectId, chatId) cannot be used in a `where`
    // when one of its fields is null, so resolve the row with findFirst instead.
    const existing = await prisma.presence.findFirst({
      where: { userId, projectId: projectId ?? null, chatId: chatId ?? null },
    });
    if (existing) {
      return prisma.presence.update({
        where: { id: existing.id },
        data: { ...rest, lastSeen: new Date() },
      });
    }
    return prisma.presence.create({
      data: { userId, projectId: projectId ?? null, chatId: chatId ?? null, ...rest },
    });
  }

  async findByProject(projectId: string) {
    return prisma.presence.findMany({
      where: { projectId, lastSeen: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
  }

  async findByChat(chatId: string) {
    return prisma.presence.findMany({
      where: { chatId, lastSeen: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
  }

  async findByUser(userId: string) {
    return prisma.presence.findMany({
      where: { userId },
      include: { project: { select: { id: true, name: true } } },
    });
  }

  async removeStale(maxAgeMs = 5 * 60 * 1000) {
    const cutoff = new Date(Date.now() - maxAgeMs);
    return prisma.presence.deleteMany({
      where: { lastSeen: { lt: cutoff } },
    });
  }

  async removeByUser(userId: string) {
    return prisma.presence.deleteMany({ where: { userId } });
  }
}

export const presenceService = new PresenceService();