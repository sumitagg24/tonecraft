import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { personaSchema } from "@/lib/validators";

const api = withApiHandler({ schema: personaSchema });

export const GET = api.GET(async (ctx) => {
  const personas = await prisma.persona.findMany({
    where: { userId: ctx.user.id },
    orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
  });
  return ok(personas);
});

export const POST = api.POST(async (ctx, body) => {
  const typedBody = body as z.infer<typeof personaSchema>;
  const persona = await prisma.persona.create({
    data: {
      name: typedBody.name,
      description: typedBody.description,
      systemPrompt: typedBody.systemPrompt,
      icon: typedBody.icon,
      color: typedBody.color,
      isDefault: typedBody.isDefault ?? false,
      isFavorite: typedBody.isFavorite ?? false,
      tone: typedBody.tone,
      temperature: typedBody.temperature,
      emojiUsage: typedBody.emojiUsage,
      writingStyle: typedBody.writingStyle,
      platformDefaults: typedBody.platformDefaults ?? {},
      projectId: typedBody.projectId ?? null,
      userId: ctx.user.id,
    },
  });
  return ok(persona, 201);
});