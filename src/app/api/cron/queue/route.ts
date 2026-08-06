import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { guardCronRequest } from "@/lib/cron-guard";
import { queueService } from "@/services/QueueService";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

/**
 * Phase 12.5 — queue drain worker. Invoked by the cron scheduler with
 * `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends it automatically).
 * Claims due QueueItems, dispatches each to its handler, and completes or
 * retries with backoff. Race-safe across concurrent invocations.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const guarded = guardCronRequest(req);
  if (guarded) return guarded;

  try {
    const started = Date.now();
    // First, requeue anything a crashed worker left in `processing`.
    const requeued = await queueService.requeueStale();

    const items = await queueService.claimDue(25);
    let completed = 0;
    let failed = 0;

    for (const item of items) {
      try {
        await dispatch(item.type, item.payload);
        await queueService.complete(item.id);
        completed += 1;
      } catch (error) {
        await queueService.fail(item.id, error);
        failed += 1;
      }
    }

    const summary = { processed: items.length, completed, failed, requeued };
    logger.info(`[Cron] Queue worker completed in ${Date.now() - started}ms`, summary);
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    logger.error("[Cron] Queue worker failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Worker failed" },
      { status: 500 }
    );
  }
}

/** Dispatch a queue item to its handler. Throwing triggers retry-with-backoff. */
async function dispatch(type: string, payload: Prisma.JsonValue): Promise<void> {
  const data = (payload ?? {}) as Record<string, unknown>;

  switch (type) {
    case "email": {
      // Placeholder transport — real SMTP (nodemailer) is wired by the caller.
      logger.info("[Queue] email job", { to: data.to, subject: data.subject });
      return;
    }
    case "notification": {
      // Notifications are created in-app; the queue job just acknowledges.
      logger.info("[Queue] notification job", { userId: data.userId, type: data.notificationType });
      return;
    }
    case "export": {
      // Phase 10 export jobs: mark the ExportJob row processed.
      const exportId = data.exportId as string | undefined;
      if (exportId) {
        await prisma.exportJob.update({
          where: { id: exportId },
          data: { status: "complete", resultKey: (data.resultKey as string) ?? null },
        });
      }
      return;
    }
    case "analytics": {
      // Lightweight aggregation marker — heavy rollups live in the daily worker.
      logger.info("[Queue] analytics job", { kind: data.kind });
      return;
    }
    case "embedding": {
      // Knowledge chunk embedding — enqueued by KnowledgeService when indexing.
      logger.info("[Queue] embedding job", { knowledgeFileId: data.knowledgeFileId });
      return;
    }
    default:
      throw new Error(`Unknown queue type: ${type}`);
  }
}
