import { prisma } from "@/lib/prisma";

export class CollaborationSessionRepository {
  async create(data: {
    projectId?: string;
    chatId?: string;
    resourceType: string;
    resourceId: string;
    participants: string[];
  }) {
    return prisma.collaborationSession.create({ data });
  }

  async findActive(resourceType: string, resourceId: string) {
    return prisma.collaborationSession.findFirst({
      where: {
        resourceType,
        resourceId,
        endedAt: null,
      },
      orderBy: { lastActivity: "desc" },
    });
  }

  async findByProject(projectId: string) {
    return prisma.collaborationSession.findMany({
      where: { projectId, endedAt: null },
      orderBy: { lastActivity: "desc" },
    });
  }

  async findByChat(chatId: string) {
    return prisma.collaborationSession.findMany({
      where: { chatId, endedAt: null },
      orderBy: { lastActivity: "desc" },
    });
  }

  async updateActivity(id: string) {
    return prisma.collaborationSession.update({
      where: { id },
      data: { lastActivity: new Date() },
    });
  }

  async endSession(id: string) {
    return prisma.collaborationSession.update({
      where: { id },
      data: { endedAt: new Date() },
    });
  }

  async endByResource(resourceType: string, resourceId: string) {
    return prisma.collaborationSession.updateMany({
      where: { resourceType, resourceId, endedAt: null },
      data: { endedAt: new Date() },
    });
  }

  async removeStale(maxAgeMs = 30 * 60 * 1000) {
    const cutoff = new Date(Date.now() - maxAgeMs);
    const result = await prisma.collaborationSession.deleteMany({
      where: {
        endedAt: { lte: cutoff },
        lastActivity: { lt: cutoff },
      },
    });
    return result.count;
  }
}

export const collaborationSessionRepository = new CollaborationSessionRepository();