import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { guardCronRequest } from "@/lib/cron-guard";
import { sendEmail, type EmailMessage } from "@/lib/email";
import { escapeHtml } from "@/lib/escape";
import { queueService } from "@/services/QueueService";
import { knowledgeService } from "@/services/KnowledgeService";
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
    return NextResponse.json({ ok: false, error: "Worker failed" }, { status: 500 });
  }
}

/** Dispatch a queue item to its handler. Throwing triggers retry-with-backoff. */
async function dispatch(type: string, payload: Prisma.JsonValue): Promise<void> {
  const data = (payload ?? {}) as Record<string, unknown>;

  switch (type) {
    case "email": {
      // Real SMTP delivery via nodemailer (see src/lib/email.ts). Throwing on
      // send failure triggers the queue's retry-with-backoff, then dead-letter.
      await sendEmail(renderNotificationEmail(data));
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
      const fileId = data.knowledgeFileId as string | undefined;
      if (!fileId) throw new Error("embedding job missing knowledgeFileId");
      await knowledgeService.embedFile(fileId, data.userId as string | undefined);
      return;
    }
    default:
      throw new Error(`Unknown queue type: ${type}`);
  }
}

/**
 * Build a notification email from the payload enqueued by NotificationService
 * (`to`, `userName`, `title`, `body`, `link`). All user-derived text is HTML-
 * escaped so notification content can never inject markup into the message.
 */
function renderNotificationEmail(data: Record<string, unknown>): EmailMessage {
  const to = data.to as string | undefined;
  if (!to) throw new Error("email job missing recipient");

  const title = (data.title as string | undefined) ?? "ToneCraft notification";
  const body = (data.body as string | undefined) ?? "";
  const link = (data.link as string | undefined) ?? null;
  const userName = (data.userName as string | undefined) ?? null;
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  const text = [greeting, "", title, "", body, ...(link ? ["", link] : [])].join("\n");
  const html = [
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a2e;">',
    `  <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>`,
    `  <h2 style="margin:0 0 12px;font-size:18px;color:#1a1a2e;">${escapeHtml(title)}</h2>`,
    `  <p style="margin:0 0 16px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(body)}</p>`,
    ...(link
      ? [
          `  <p><a href="${escapeHtml(link)}" style="background:#7C74F5;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block;">View on ToneCraft</a></p>`,
        ]
      : []),
    '  <p style="margin:24px 0 0;font-size:12px;color:#888;">Sent by ToneCraft</p>',
    "</div>",
  ].join("\n");

  return { to, subject: title, text, html };
}


