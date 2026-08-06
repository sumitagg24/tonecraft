import { prisma } from "@/lib/prisma";

export class CollaborationSessionService {
  async createSession(data: {
    projectId?: string;
    chatId?: string;
    resourceType: string;
    resourceId: string;
    participants: string[];
  }) {
    return prisma.collaborationSession.create({
      data,
    });
  }

  async getActiveSession(resourceType: string, resourceId: string) {
    return prisma.collaborationSession.findFirst({
      where: {
        resourceType,
        resourceId,
        endedAt: null,
      },
      orderBy: { lastActivity: "desc" },
    });
  }

  async updateActivity(sessionId: string) {
    return prisma.collaborationSession.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });
  }

  async endSession(sessionId: string) {
    return prisma.collaborationSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });
  }

  async endSessionsByResource(resourceType: string, resourceId: string) {
    return prisma.collaborationSession.updateMany({
      where: { resourceType, resourceId, endedAt: null },
      data: { endedAt: new Date() },
    });
  }

  async removeStaleSessions(maxAgeMs = 30 * 60 * 1000) {
    const cutoff = new Date(Date.now() - maxAgeMs);
    return prisma.collaborationSession.deleteMany({
      where: {
        endedAt: { lte: cutoff },
        lastActivity: { lt: cutoff },
      },
    });
  }
}

export const collaborationSessionService = new CollaborationSessionService();