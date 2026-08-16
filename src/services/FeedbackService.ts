import { prisma } from "@/lib/prisma";
import type { FeedbackCategory, FeedbackStatus } from "@prisma/client";

export type FeedbackCategoryValue = "bug" | "feature_request" | "general" | "other";
export type FeedbackStatusValue = "NEW" | "REVIEWED" | "RESOLVED";

export interface CreateFeedbackInput {
  userId: string;
  category: FeedbackCategoryValue;
  rating?: number | null;
  message: string;
  page?: string | null;
}

const CATEGORIES: FeedbackCategoryValue[] = ["bug", "feature_request", "general", "other"];
const STATUSES: FeedbackStatusValue[] = ["NEW", "REVIEWED", "RESOLVED"];

export function isFeedbackCategory(v: unknown): v is FeedbackCategoryValue {
  return typeof v === "string" && (CATEGORIES as string[]).includes(v);
}

export function isFeedbackStatus(v: unknown): v is FeedbackStatusValue {
  return typeof v === "string" && (STATUSES as string[]).includes(v);
}

export class FeedbackService {
  async create(input: CreateFeedbackInput) {
    return prisma.feedback.create({
      data: {
        userId: input.userId,
        category: input.category as FeedbackCategory,
        rating: input.rating ?? null,
        message: input.message,
        page: input.page ?? null,
      },
      select: {
        id: true,
        category: true,
        rating: true,
        message: true,
        page: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /** A user's own submissions — always scoped to their id. */
  async listOwn(userId: string) {
    return prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        category: true,
        rating: true,
        message: true,
        page: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /** Admin triage list with optional category/status filters. */
  async listAdmin(opts: { category?: FeedbackCategoryValue | null; status?: FeedbackStatusValue | null; take?: number }) {
    return prisma.feedback.findMany({
      where: {
        ...(opts.category ? { category: opts.category as FeedbackCategory } : {}),
        ...(opts.status ? { status: opts.status as FeedbackStatus } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(opts.take ?? 100, 200),
      select: {
        id: true,
        category: true,
        rating: true,
        message: true,
        page: true,
        status: true,
        reviewedAt: true,
        reviewedBy: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  /**
   * Update triage status. Returns the updated row or null when the id doesn't
   * exist (caller maps to 404). Only status transitions are allowed — content
   * is immutable after submission.
   */
  async updateStatus(id: string, status: FeedbackStatusValue, adminUserId: string) {
    const now = new Date();
    const existing = await prisma.feedback.findUnique({ where: { id } });
    if (!existing) return null;

    return prisma.feedback.update({
      where: { id },
      data: {
        status: status as FeedbackStatus,
        reviewedAt: now,
        reviewedBy: adminUserId,
      },
      select: {
        id: true,
        category: true,
        rating: true,
        message: true,
        page: true,
        status: true,
        reviewedAt: true,
        reviewedBy: true,
        createdAt: true,
      },
    });
  }
}

export const feedbackService = new FeedbackService();
