import { activityRepository } from "@/repositories/ActivityRepository";
import { workspaceActivityRepository } from "@/repositories/WorkspaceActivityRepository";
import type { Activity } from "@prisma/client";

export interface ActivitySummary {
  id: string;
  userId: string;
  projectId?: string;
  chatId?: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  user?: { id: string; name: string | null; image: string | null };
}

export interface ActivityFilter {
  projectId?: string;
  chatId?: string;
  userId?: string;
  type?: string;
  page?: number;
  perPage?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface ActivityAggregation {
  byType: Array<{ type: string; _count: { id: number } }>;
  total: number;
}

export class ActivityService {
  async record(data: {
    userId: string;
    projectId?: string;
    chatId?: string;
    type: string;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ActivitySummary> {
    return activityRepository.create(data) as unknown as ActivitySummary;
  }

  async list(filter: ActivityFilter): Promise<{ items: ActivitySummary[]; total: number }> {
    const {
      projectId,
      chatId,
      userId,
      type,
      page = 1,
      perPage = 20,
    } = filter;

    let items: ActivitySummary[];
    let total: number;

    if (projectId && chatId) {
      items = await activityRepository.findByChat(chatId, page, perPage) as unknown as ActivitySummary[];
      total = await activityRepository.countByChat(chatId);
    } else if (projectId) {
      items = await activityRepository.findByProject(projectId, page, perPage) as unknown as ActivitySummary[];
      total = await activityRepository.countByProject(projectId);
    } else if (userId) {
      items = await activityRepository.findByUser(userId, page, perPage) as unknown as ActivitySummary[];
      total = await activityRepository.countByUser(userId);
    } else if (type) {
      items = await activityRepository.findByType(type, page, perPage) as unknown as ActivitySummary[];
      total = await activityRepository.countByType(type);
    } else {
      items = await activityRepository.findByUser(userId ?? "", page, perPage) as unknown as ActivitySummary[];
      total = items.length;
    }

    return { items, total };
  }

  async aggregate(filter: { projectId?: string; userId?: string }): Promise<ActivityAggregation> {
    if (filter.projectId) {
      return activityRepository.aggregateByProject(filter.projectId) as unknown as ActivityAggregation;
    }
    if (filter.userId) {
      return activityRepository.aggregateByUser(filter.userId) as unknown as ActivityAggregation;
    }
    return { byType: [], total: 0 };
  }

  async getWorkspaceStats(workspaceId: string): Promise<{
    totalActivities: number;
    activitiesByType: Array<{ type: string; count: number }>;
    recentActivity: Array<{ type: string; user: string; timestamp: Date }>;
  }> {
    const stats = await workspaceActivityRepository.getActivityStats(workspaceId);
    const recent = await workspaceActivityRepository.findByWorkspace(workspaceId, 1, 10);
    return {
      totalActivities: stats.total,
      activitiesByType: stats.byType.map((bt: any) => ({ type: bt.type, count: bt._count.id })),
      recentActivity: recent.map((a: any) => ({
        type: a.type,
        user: a.user?.name || "Unknown",
        timestamp: a.createdAt,
      })),
    };
  }
}

export const activityService = new ActivityService();