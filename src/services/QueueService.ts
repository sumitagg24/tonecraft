import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";

/**
 * Phase 12.5 — DB-backed background queue.
 *
 * Slow work (emails, exports, notifications, analytics, embeddings) is enqueued
 * here and drained by the /api/cron/queue worker (CRON_SECRET-guarded, same
 * pattern as the automation worker). Items are claimed atomically via a
 * `status`/`lockedAt` update so concurrent worker invocations never process
 * the same item twice.
 */

export type QueueType = "email" | "export" | "notification" | "analytics" | "embedding";

export interface EnqueueOptions {
  /** ISO date before which the item must not be processed (retry backoff). */
  availableAt?: Date;
  maxAttempts?: number;
}

const BASE_BACKOFF_MS = 60_000; // 1 minute, doubles per attempt

export class QueueService {
  async enqueue(type: QueueType, payload: Record<string, unknown>, options: EnqueueOptions = {}): Promise<string> {
    const item = await prisma.queueItem.create({
      data: {
        type,
        payload: payload as Prisma.InputJsonValue,
        availableAt: options.availableAt ?? new Date(),
        maxAttempts: options.maxAttempts ?? 5,
      },
      select: { id: true },
    });
    return item.id;
  }

  /**
   * Claim up to `limit` due items for processing. Race-safe: each item is
   * claimed with `updateMany` scoped to `status: pending`, so exactly one
   * worker wins even under concurrent invocations.
   */
  async claimDue(limit = 25): Promise<Array<{ id: string; type: string; payload: Prisma.JsonValue }>> {
    const due = await prisma.queueItem.findMany({
      where: { status: "pending", availableAt: { lte: new Date() } },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { id: true, type: true, payload: true, attempts: true, maxAttempts: true },
    });

    const claimed: Array<{ id: string; type: string; payload: Prisma.JsonValue }> = [];
    for (const item of due) {
      const res = await prisma.queueItem.updateMany({
        where: { id: item.id, status: "pending" },
        data: { status: "processing", lockedAt: new Date() },
      });
      if (res.count === 1) {
        claimed.push({ id: item.id, type: item.type, payload: item.payload });
      }
    }
    return claimed;
  }

  async complete(id: string): Promise<void> {
    await prisma.queueItem.update({
      where: { id },
      data: { status: "succeeded", processedAt: new Date(), lastError: null },
    });
  }

  /**
   * Mark failed and either retry with exponential backoff (if attempts remain)
   * or dead-letter it as failed.
   */
  async fail(id: string, error: unknown): Promise<{ status: "retry" | "dead" }> {
    const message = error instanceof Error ? error.message : String(error);
    const item = await prisma.queueItem.findUnique({ where: { id }, select: { attempts: true, maxAttempts: true } });
    if (!item) return { status: "dead" };

    const attempts = item.attempts + 1;
    if (attempts >= item.maxAttempts) {
      await prisma.queueItem.update({
        where: { id },
        data: { status: "failed", attempts, lastError: message.slice(0, 500), lockedAt: null, processedAt: new Date() },
      });
      logger.error(`[Queue] ${id} dead-lettered after ${attempts} attempts`, { error: message });
      return { status: "dead" };
    }

    const backoffMs = BASE_BACKOFF_MS * 2 ** (attempts - 1);
    await prisma.queueItem.update({
      where: { id },
      data: {
        status: "pending",
        attempts,
        lastError: message.slice(0, 500),
        availableAt: new Date(Date.now() + backoffMs),
        lockedAt: null,
      },
    });
    return { status: "retry" };
  }

  async stats(): Promise<{ pending: number; processing: number; succeeded: number; failed: number }> {
    const [pending, processing, succeeded, failed] = await Promise.all([
      prisma.queueItem.count({ where: { status: "pending" } }),
      prisma.queueItem.count({ where: { status: "processing" } }),
      prisma.queueItem.count({ where: { status: "succeeded" } }),
      prisma.queueItem.count({ where: { status: "failed" } }),
    ]);
    return { pending, processing, succeeded, failed };
  }

  /** Unstick items left in `processing` by a crashed worker (claimed > 10 min ago). */
  async requeueStale(staleMs = 10 * 60_000): Promise<number> {
    const stale = await prisma.queueItem.updateMany({
      where: { status: "processing", lockedAt: { lt: new Date(Date.now() - staleMs) } },
      data: { status: "pending", lockedAt: null },
    });
    return stale.count;
  }
}

export const queueService = new QueueService();
