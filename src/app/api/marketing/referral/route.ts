import { z } from "zod";
import { fail, ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { auditLogService } from "@/services/AuditLogService";
import { logger } from "@/lib/logger";

const REFERRAL_BONUS = 50;

const schema = z.object({
  referralCode: z.string().min(4).max(64),
});

const api = withApiHandler({ schema });

/**
 * Redeems a referral code for the authenticated user. The bonus is granted at
 * most once per user (tracked via the audit log) and never pushes credit usage
 * below zero.
 */
export const POST = api.POST(async (ctx, body) => {
  const { referralCode } = body as z.infer<typeof schema>;

  const alreadyRedeemed = await prisma.auditLog.findFirst({
    where: { actorId: ctx.user.id, action: "marketing.referral_redeem" },
    select: { id: true },
  });
  if (alreadyRedeemed) return fail("ALREADY_REDEEMED", "Referral bonus already granted", 409);

  const usage = await prisma.usage.findUnique({
    where: { userId: ctx.user.id },
    select: { creditsUsed: true },
  });
  const bonusCredits = Math.min(REFERRAL_BONUS, usage?.creditsUsed ?? 0);

  if (bonusCredits > 0) {
    await prisma.usage.update({
      where: { userId: ctx.user.id },
      data: { creditsUsed: { decrement: bonusCredits } },
    });
  }

  await auditLogService.record("marketing.referral_redeem", "referral", {
    actorId: ctx.user.id,
    metadata: { referralCode, bonusCredits },
  });
  logger.info("[Referral] Code redeemed", { userId: ctx.user.id, bonusCredits });

  return ok({ success: true, bonusCredits });
});
