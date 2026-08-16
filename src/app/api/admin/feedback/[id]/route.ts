import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { z } from "zod";
import { feedbackService, isFeedbackStatus } from "@/services/FeedbackService";
import { isGlobalAdmin } from "@/lib/admin";

const api = withApiHandler();

const statusSchema = z.object({
  status: z.string().refine(isFeedbackStatus, "Invalid status"),
});

/**
 * Update feedback triage status (NEW → REVIEWED → RESOLVED). Global-admin
 * only; the reviewing admin is recorded on the row.
 */
export const PATCH = api.PATCH(async (ctx, body) => {
  if (!(await isGlobalAdmin(ctx.user.id))) {
    return fail("FORBIDDEN", "Admin access required", 403);
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid status", 400);
  }

  const updated = await feedbackService.updateStatus(
    ctx.params.id,
    parsed.data.status,
    ctx.user.id
  );
  if (!updated) return notFound();

  return ok(updated);
});
