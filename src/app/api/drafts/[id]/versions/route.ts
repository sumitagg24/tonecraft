import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const versions = await prisma.draftVersion.findMany({
    where: { draftId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return ok({ versions });
});

export const POST = api.POST(async (ctx, body) => {
  const { id } = ctx.params;
  const { content } = body as { content: string };

  const draft = await prisma.draft.findFirst({
    where: { id, userId: ctx.user.id },
  });
  if (!draft) return notFound();

  const version = await prisma.draftVersion.create({
    data: {
      draftId: id,
      content,
    },
  });

  const count = await prisma.draftVersion.count({ where: { draftId: id } });
  if (count > 50) {
    const oldest = await prisma.draftVersion.findMany({
      where: { draftId: id },
      orderBy: { createdAt: "asc" },
      take: 1,
    });
    if (oldest[0]) {
      await prisma.draftVersion.delete({ where: { id: oldest[0].id } });
    }
  }

  return ok(version, 201);
});
