import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

const api = withApiHandler();

/**
 * GET /api/billing/customer — returns the current user's Paddle customer ID.
 * Used client-side to populate pwCustomer in Paddle.Initialize() for Retain
 * (dunning / payment recovery). Only the Paddle customer ID (ctm_...) is
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
