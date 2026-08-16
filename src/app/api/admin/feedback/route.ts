import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { feedbackService, isFeedbackCategory, isFeedbackStatus } from "@/services/FeedbackService";
import { isGlobalAdmin } from "@/lib/admin";

const api = withApiHandler();

/**
 * Admin triage list for user feedback. Global-admin gated (ADMIN_EMAILS) —
 * workspace-admin role is NOT sufficient, this surfaces submissions from every
 * user in the product. Optional ?category= and ?status= filters.
 */
export const GET = api.GET(async (ctx) => {
  if (!(await isGlobalAdmin(ctx.user.id))) {
    return fail("FORBIDDEN", "Admin access required", 403);
  }

  const categoryParam = ctx.request.nextUrl.searchParams.get("category");
  const statusParam = ctx.request.nextUrl.searchParams.get("status");

  if (categoryParam && !isFeedbackCategory(categoryParam)) {
    return fail("VALIDATION_ERROR", "Invalid category filter", 400);
  }
  if (statusParam && !isFeedbackStatus(statusParam)) {
    return fail("VALIDATION_ERROR", "Invalid status filter", 400);
  }

  const feedback = await feedbackService.listAdmin({
    category: isFeedbackCategory(categoryParam) ? categoryParam : null,
    status: isFeedbackStatus(statusParam) ? statusParam : null,
  });

  return ok({ feedback });
});
