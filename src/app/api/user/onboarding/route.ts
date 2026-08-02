import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const onboardingSchema = z.object({
  writingType: z.string().min(1),
  language: z.string().min(1),
  tone: z.string().min(1),
});

const api = withApiHandler({ schema: onboardingSchema });

export const POST = api.POST(async (ctx, body) => {
  const { language, tone } = body as typeof onboardingSchema._output;

  await prisma.user.update({
    where: { id: ctx.user.id },
    data: {
      preferredLanguage: language,
      defaultTone: tone,
    },
  });

  return ok({ ok: true });
});
