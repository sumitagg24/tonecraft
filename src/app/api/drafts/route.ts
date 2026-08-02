import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const chatId = ctx.request.nextUrl.searchParams.get("chatId") || undefined;
  const drafts = await prisma.draft.findMany({
    where: {
      userId: ctx.user.id,
      ...(chatId ? { chatId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 5 } },
  });
  return ok({ drafts });
});

export const PUT = api.PUT(async (ctx, body) => {
  const { chatId, content, tone, personaId, platform, language } = (body ?? {}) as {
    chatId?: string;
    content?: string;
    tone?: string;
    personaId?: string;
    platform?: string;
    language?: string;
  };

  const draft = await prisma.draft.upsert({
    where: {
      userId_chatId: {
        userId: ctx.user.id,
        chatId: chatId ?? "scratch",
      },
    },
    create: {
      userId: ctx.user.id,
      chatId: chatId ?? null,
      content: content ?? "",
      tone: tone ?? null,
      personaId: personaId ?? null,
      platform: platform ?? null,
      language: language ?? null,
    },
    update: {
      content: content ?? undefined,
      tone: tone ?? undefined,
      personaId: personaId ?? undefined,
      platform: platform ?? undefined,
      language: language ?? undefined,
      updatedAt: new Date(),
    },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 3 } },
  });

  return ok(draft);
});

export const DELETE = api.DELETE(async (ctx) => {
  const chatId = ctx.request.nextUrl.searchParams.get("chatId") || undefined;
  if (!chatId) return fail("BAD_REQUEST", "chatId is required", 400);
  await prisma.draft.deleteMany({
    where: { userId: ctx.user.id, chatId },
  });
  return ok({ ok: true });
});
