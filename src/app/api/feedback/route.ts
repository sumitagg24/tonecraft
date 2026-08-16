import { ok, withApiHandler } from "@/lib/withApiHandler";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { queueService } from "@/services/QueueService";
import { feedbackService, isFeedbackCategory } from "@/services/FeedbackService";
import { logger } from "@/lib/logger";

/**
 * In-app feedback submission.
 *
 * Security contract:
 *  - Authenticated only (withApiHandler default).
 *  - userId always comes from the session — never from the request body.
 *  - zod-validated; message length capped (10,000 chars) and rating bounded 1–5.
 *  - Rate limited per user (5/min) so the endpoint can't be used to spam the
 *    admin inbox or fill the Feedback table.
 *  - On success, an email notification is enqueued to FEEDBACK_NOTIFICATION_EMAIL
 *    (the operator-controlled inbox). No email address is ever hardcoded; when
 *    the variable is unset, the enqueue is skipped silently.
 */
const submitSchema = z.object({
  category: z.string().refine(isFeedbackCategory, "Invalid category"),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  message: z.string().trim().min(1, "Message is required").max(10_000, "Message is too long"),
  page: z.string().trim().max(500).optional().nullable(),
});

const api = withApiHandler({
  schema: submitSchema,
  rateLimit: { key: "feedback", limit: 5, ipLimit: 30 },
});

export const POST = api.POST(async (ctx, body) => {
  const b = body as z.infer<typeof submitSchema>;

  const created = await feedbackService.create({
    userId: ctx.user.id,
    category: b.category,
    rating: b.rating ?? null,
    message: b.message,
    page: b.page ?? null,
  });

  await notifyFeedbackEmail(ctx.user.id, created);

  return ok(
    { id: created.id, status: created.status, createdAt: created.createdAt },
    201
  );
});

export const GET = api.GET(async (ctx) => {
  const items = await feedbackService.listOwn(ctx.user.id);
  return ok({ feedback: items });
});

/** Enqueue an email to the operator inbox (FEEDBACK_NOTIFICATION_EMAIL). */
async function notifyFeedbackEmail(
  userId: string,
  created: { id: string; category: string; rating: number | null; message: string; page: string | null }
): Promise<void> {
  const inbox = process.env.FEEDBACK_NOTIFICATION_EMAIL;
  if (!inbox) return; // no inbox configured — nothing to notify

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  const details = [
    `From: ${user?.email ?? "unknown"}${user?.name ? ` (${user.name})` : ""}`,
    `Category: ${created.category}`,
    created.rating ? `Rating: ${created.rating}/5` : "Rating: —",
    created.page ? `Page: ${created.page}` : "Page: —",
    "",
    created.message,
  ].join("\n");

  try {
    await queueService.enqueue("email", {
      to: inbox,
      title: `New ToneCraft feedback: ${created.category}`,
      body: details,
      link: null,
    });
  } catch (err) {
    // A failed enqueue must not fail the user's submission — log and move on.
    logger.error("[Feedback] email notification enqueue failed", {
      feedbackId: created.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
