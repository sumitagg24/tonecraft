import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { personaSchema } from "@/lib/validators";

const api = withApiHandler({ schema: personaSchema });

export const GET = api.GET(async (ctx) => {
  const projectId = ctx.request.nextUrl.searchParams.get("projectId") || undefined;
  const personas = await prisma.persona.findMany({
    where: projectId ? { userId: ctx.user.id, projectId } : { userId: ctx.user.id },
    orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
  });
  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: { defaultPersonaId: true },
  });
  return ok({ personas, defaultPersonaId: user?.defaultPersonaId ?? null });
});

export const POST = api.POST(async (ctx, body) => {
  const { isDefault, ...data } = body as typeof personaSchema._output;
  const persona = await prisma.persona.create({
    data: {
      userId: ctx.user.id,
      ...data,
      platformDefaults: data.platformDefaults as Prisma.InputJsonValue | undefined,
    },
  });
  if (isDefault) {
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { defaultPersonaId: persona.id },
    });
  }
  return ok(persona, 201);
});
