import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

const api = withApiHandler();

/**
 * GET /api/billing/customer — returns the current user's Dodo customer ID.
 * Used client-side for customer identification
 * Only the Dodo customer ID is
 * exposed — never internal IDs or emails.
 */
export const GET = api.GET(async (ctx) => {
  const sub = await prisma.subscription.findUnique({
    where: { userId: ctx.user.id },
    select: { providerCustomerId: true },
  });

  if (!sub?.providerCustomerId) {
    return fail("NOT_FOUND", "No billing customer found.", 404);
  }

  return ok({ customerId: sub.providerCustomerId });
});
