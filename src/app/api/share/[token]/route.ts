import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

/**
 * Shared chats are public-by-token: anyone holding the (unguessable) token can
 * read the shared chat without an account — the share page lives in the public
 * route group and the owner shares the link with people who may not have a
 * ToneCraft session. GET is therefore explicitly public, with a per-IP rate
 * limit so the token can't be used to hammer the database.
 *
 * DELETE (revoke) is authenticated and OWNERSHIP-CHECKED: only the user who
 * created the share link may revoke it. Previously any signed-in user who
 * knew a token could revoke someone else's link (IDOR).
 */
// GET is public-by-token (rate limited by IP); DELETE (revoke) requires the
// owner's session — the two handlers need different auth settings, so they
// get separate withApiHandler instances.
const publicApi = withApiHandler({
  auth: false,
  rateLimit: { key: "share-view", limit: 30, ipLimit: 60 },
});
const authedApi = withApiHandler();

export const GET = publicApi.GET(async (ctx) => {
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

export const DELETE = authedApi.DELETE(async (ctx) => {
  const { token } = ctx.params;
  // Ownership: the update is scoped to links the caller created. A token that
  // exists but belongs to another user is indistinguishable from one that
  // doesn't exist — both 404, so an attacker can't probe which tokens are real.
  const { count } = await prisma.shareLink.updateMany({
    where: { token, userId: ctx.user.id },
    data: { revoked: true },
  });
  if (count === 0) return fail("NOT_FOUND", "Link not found", 404);
  return ok({ ok: true });
});
