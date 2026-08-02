import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { capabilities } from "@/lib/capabilities";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const usage = await prisma.usage.findUnique({
    where: { userId: ctx.user.id },
  });
  const plan = await capabilities.require({ userId: ctx.user.id });

  return ok({
    usage: usage || {
      messagesSent: 0,
      tokensUsed: 0,
      filesUploaded: 0,
      storageUsed: 0,
    },
    plan: plan.tier,
    limits: {
      messagesPerDay: plan.limits.messagesPerDay,
      messagesPerHour: plan.limits.messagesPerHour,
    },
  });
});
