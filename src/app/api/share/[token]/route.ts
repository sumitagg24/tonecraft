import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { token } = ctx.params;
  const share = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      chat: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            // model/provider identifiers are deliberately not exposed on public share links
            select: { id: true, role: true, content: true, createdAt: true },
          },
        },
      },
    },
  });

  if (!share || share.revoked) {
    return fail("NOT_FOUND", "Link not found or revoked", 404);
  }
  if (share.expiresAt && share.expiresAt < new Date()) {
    return fail("GONE", "Link has expired", 410);
  }

  return ok({
    token: share.token,
    createdAt: share.createdAt,
    chat: share.chat
      ? {
          id: share.chat.id,
          title: share.chat.title,
          messages: share.chat.messages,
        }
      : null,
  });
});

export const DELETE = api.DELETE(async (ctx) => {
  const { token } = ctx.params;
  await prisma.shareLink.updateMany({ where: { token }, data: { revoked: true } });
  return ok({ ok: true });
});
