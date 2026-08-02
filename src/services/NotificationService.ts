import { prisma } from "@/lib/prisma";

export class NotificationService {
  async create(userId: string, type: string, title: string, body?: string | null, link?: string | null) {
    const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
    if (prefs && !prefs.inAppEnabled) return null;

    const typeMap: Record<string, boolean> = {
      generation_finished: prefs?.generationComplete ?? true,
      credits_low: prefs?.creditsLow ?? true,
      team_invite: prefs?.invite ?? true,
      knowledge_indexed: prefs?.knowledgeReady ?? true,
      export_completed: prefs?.exportReady ?? true,
      export_failed: prefs?.exportReady ?? true,
      mention: prefs?.comment ?? true,
      subscription: prefs?.creditsLow ?? true,
    };

    if (typeMap[type] === false) return null;

    return prisma.notification.create({
      data: { userId, type, title, body, link },
    });
  }

  async list(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, id: string) {
    return prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }

  async clearAll(userId: string) {
    return prisma.notification.deleteMany({ where: { userId } });
  }

  async getPreferences(userId: string) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updatePreferences(userId: string, data: Record<string, boolean>) {
    const allowed = [
      "emailEnabled", "inAppEnabled", "generationComplete", "creditsLow",
      "knowledgeReady", "exportReady", "invite", "comment",
    ];
    const clean: Record<string, boolean> = {};
    for (const key of allowed) {
      if (typeof data[key] === "boolean") clean[key] = data[key];
    }
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...clean },
      update: { ...clean },
    });
  }
}

export const notificationService = new NotificationService();
