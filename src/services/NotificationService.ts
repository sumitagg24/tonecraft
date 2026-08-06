import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getSocketInstance } from "@/lib/socket";
import { NotificationType, NotificationChannel } from "@prisma/client";
import type { NotificationPreference } from "@prisma/client";

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
  workspaceId?: string | null;
}

interface ChannelPreference {
  email: boolean;
  push: boolean;
  inApp: boolean;
  realtime: boolean;
}

interface CategoryPreference {
  generation_complete: boolean;
  credits_low: boolean;
  knowledge_ready: boolean;
  export_ready: boolean;
  invite: boolean;
  comment: boolean;
  mention: boolean;
  subscription: boolean;
  digest: boolean;
  system: boolean;
}

function getCategoryFromType(type: NotificationType): keyof CategoryPreference {
  switch (type) {
    case "generation_finished": return "generation_complete";
    case "credits_low": return "credits_low";
    case "knowledge_indexed": return "knowledge_ready";
    case "export_completed": return "export_ready";
    case "export_failed": return "export_ready";
    case "team_invite": return "invite";
    case "comment": return "comment";
    case "mention": return "mention";
    case "subscription": return "subscription";
    case "digest": return "digest";
    case "system": return "system";
  }
}

function prefsToCategories(prefs: NotificationPreference): CategoryPreference {
  return {
    generation_complete: prefs.generationComplete,
    credits_low: prefs.creditsLow,
    knowledge_ready: prefs.knowledgeReady,
    export_ready: prefs.exportReady,
    invite: prefs.invite,
    comment: prefs.comment,
    mention: prefs.mention,
    subscription: prefs.subscription,
    digest: prefs.dailyDigest,
    system: prefs.system,
  };
}

function prefsToChannels(prefs: NotificationPreference): ChannelPreference {
  return {
    email: prefs.emailEnabled,
    push: prefs.pushEnabled,
    inApp: prefs.inAppEnabled,
    realtime: prefs.realtimeEnabled,
  };
}

export class NotificationService {
  async create(payload: NotificationPayload): Promise<boolean> {
    const { userId, type, title, body, link, metadata, workspaceId } = payload;

    const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
    const categories = prefs ? prefsToCategories(prefs) : null;
    const channels = prefs ? prefsToChannels(prefs) : { email: true, push: false, inApp: true, realtime: true };

    const categoryKey = getCategoryFromType(type);
    if (categories && !categories[categoryKey]) {
      return false;
    }

    if (!channels.inApp && !channels.email && !channels.push && !channels.realtime) {
      return false;
    }

    const results: boolean[] = [];

    if (channels.inApp) {
      await prisma.notification.create({
        data: {
          userId,
          type,
          channel: "in_app" as NotificationChannel,
          title,
          body,
          link,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      });
      results.push(true);
    }

    if (channels.email) {
      void this.sendEmail(userId, type, title, body, link);
      results.push(true);
    }

    if (channels.push) {
      void this.sendPush(userId, type, title, body ?? null, link ?? null, metadata);
      results.push(true);
    }

    if (channels.realtime) {
      this.broadcastRealtime(userId, type, title, body ?? null, link ?? null, workspaceId);
      results.push(true);
    }

    return results.length > 0;
  }

  private async sendEmail(userId: string, type: NotificationType, title: string, body?: string | null, link?: string | null): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (!user?.email) return;

      logger.info("[NotificationService] Email notification queued", { userId, type, title });
    } catch (err) {
      logger.error("[NotificationService] Email delivery failed", { userId, type }, err instanceof Error ? err : undefined);
    }
  }

  private async sendPush(userId: string, type: NotificationType, title: string, body: string | null, link: string | null, metadata?: Record<string, unknown> | null): Promise<void> {
    try {
      const subs = await prisma.pushSubscription.findMany({
        where: { userId },
        select: { endpoint: true, keys: true },
      });

      if (subs.length === 0) return;

      logger.info("[NotificationService] Push notification queued", { userId, type, title, recipients: subs.length });
    } catch (err) {
      logger.error("[NotificationService] Push delivery failed", { userId, type }, err instanceof Error ? err : undefined);
    }
  }

  private broadcastRealtime(
    userId: string,
    type: NotificationType,
    title: string,
    body: string | null,
    link: string | null,
    workspaceId?: string | null
  ): void {
    try {
      const io = getSocketInstance();
      if (io) {
        io.to(`user:${userId}`).emit("notification", {
          type,
          title,
          body,
          link,
          workspaceId,
          timestamp: new Date().toISOString(),
        });
      }

      if (workspaceId) {
        io?.to(`workspace:${workspaceId}`).emit("workspace-notification", {
          userId,
          type,
          title,
          body,
          link,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      logger.error("[NotificationService] Realtime broadcast failed", { userId, type }, err instanceof Error ? err : undefined);
    }
  }

  async createMention(mentionerId: string, mentionedUserId: string, resource: string, resourceId: string, content: string, link?: string | null): Promise<void> {
    const mentioner = await prisma.user.findUnique({
      where: { id: mentionerId },
      select: { name: true },
    });
    const name = mentioner?.name ?? "Someone";

    void this.create({
      userId: mentionedUserId,
      type: "mention",
      title: `mentioned you in ${resource}`,
      body: content,
      link,
      metadata: { mentionerId, resource, resourceId },
    });
  }

  async createComment(commenterId: string, targetUserId: string, resource: string, resourceId: string, content: string, link?: string | null): Promise<void> {
    if (commenterId === targetUserId) return;

    void this.create({
      userId: targetUserId,
      type: "comment",
      title: `new comment on ${resource}`,
      body: content,
      link,
      metadata: { commenterId, resource, resourceId },
    });
  }

  async createInvitation(inviterId: string, inviteeEmail: string, workspaceId: string, workspaceName: string, role: string): Promise<void> {
    const invitee = await prisma.user.findUnique({
      where: { email: inviteeEmail },
      select: { id: true },
    });

    if (invitee) {
      void this.create({
        userId: invitee.id,
        type: "team_invite",
        title: "Workspace invitation",
        body: `You've been invited to "${workspaceName}" as ${role}`,
        link: `/workspaces/${workspaceId}`,
        metadata: { inviterId: inviterId, workspaceId, workspaceName, role },
        workspaceId,
      });
    }
  }

  async list(userId: string, limit = 20, type?: NotificationType, unreadOnly = false) {
    const where: Record<string, unknown> = { userId };
    if (type) where.type = type;
    if (unreadOnly) where.readAt = null;

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 100),
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

  async updatePreferences(userId: string, data: Record<string, unknown>) {
    const allowed = [
      "emailEnabled", "pushEnabled", "inAppEnabled", "realtimeEnabled", "dailyDigest",
      "generationComplete", "creditsLow", "knowledgeReady", "exportReady",
      "invite", "comment", "mention", "subscription", "system",
    ];
    const clean: Record<string, unknown> = {};
    for (const key of allowed) {
      if (typeof data[key] === "boolean") clean[key] = data[key];
    }
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...clean },
      update: { ...clean },
    });
  }

  async savePushSubscription(userId: string, endpoint: string, keys: Record<string, string>) {
    return prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, keys },
      update: { userId, keys, lastUsed: new Date() },
    });
  }

  async digest(userId: string, since: Date): Promise<void> {
    if (!since) return;

    const prefs = await this.getPreferences(userId);
    if (!prefs.dailyDigest) return;

    const recent = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: { gte: since, lt: new Date() },
        type: { not: "digest" },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    if (recent.length === 0) return;

    const title = `${recent.length} notifications summary`;
    const body = recent.map((n) => n.title).join(", ");

    void this.create({
      userId,
      type: "digest",
      title,
      body,
      link: "/notifications",
      metadata: { count: recent.length, items: recent.map((n) => ({ id: n.id, title: n.title, type: n.type })) },
    });
  }
}

export const notificationService = new NotificationService();
