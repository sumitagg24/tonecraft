import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const api = withApiHandler();

export const POST = api.POST(async (ctx, body) => {
  const { chatId, expiresInDays } = (body ?? {}) as {
    chatId?: string;
    expiresInDays?: number;
  };

  if (!chatId) return fail("BAD_REQUEST", "chatId is required", 400);

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: ctx.user.id },
    select: { id: true },
  });
  if (!chat) return notFound();

  const token = generateToken();
  const share = await prisma.shareLink.create({
    data: {
      token,
      userId: ctx.user.id,
      chatId,
      role: "viewer",
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null,
    },
  });

  const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/share/${token}`;
  return ok({ url, token: share.token, expiresAt: share.expiresAt }, 201);
});
