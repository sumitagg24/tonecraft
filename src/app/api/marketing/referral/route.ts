import { fail, withApiHandler } from "@/lib/withApiHandler";
import { z } from "zod";

/**
 * Referral endpoint — the referral program is not implemented yet: there is
 * no referral-code registry (no model/column in Prisma), so no code can
 * resolve to a real referrer. The route is auth-required, validated, and rate
 * limited, and returns 404 rather than awarding credits blindly.
 *
 * (Security: the previous implementation let ANY anonymous caller POST an
 * arbitrary userId + referralCode and decrement that user's `creditsUsed`,
 * i.e. farm unlimited credits. The userId must come from the session, never
 * from the request body.)
 */
const schema = z.object({
  referralCode: z
    .string()
    .trim()
    .min(4, "Referral code is too short")
    .max(64, "Referral code is too long")
    .regex(/^[A-Za-z0-9_-]+$/, "Referral code contains invalid characters"),
});

const api = withApiHandler({
  schema,
  rateLimit: { key: "referral", limit: 10, ipLimit: 30 },
});

export const POST = api.POST(async () => {
  // No referral registry exists yet — nothing to validate against, so there
  // can be no valid code. Keep the route alive for the future feature while
  // refusing to award credits today.
  return fail(
    "REFERRAL_NOT_AVAILABLE",
    "Referral codes are not available yet.",
    404
  );
});
