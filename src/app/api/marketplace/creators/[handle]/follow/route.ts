import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { marketplaceService } from "@/services/MarketplaceService";
import { prisma } from "@/lib/prisma";

const api = withApiHandler({ feature: "marketplace", rateLimit: { key: "marketplace", limit: 30 } });

// POST /api/marketplace/creators/[handle]/follow
export const POST = api.POST(async (ctx) => {
  const profile = await prisma.creatorProfile.findUnique({ where: { handle: ctx.params.handle } });
  if (!profile) return notFound();
  const followed = await marketplaceService.follow(ctx.user.id, profile.userId);
  return ok({ followed });
});

// DELETE /api/marketplace/creators/[handle]/follow
export const DELETE = api.DELETE(async (ctx) => {
  const profile = await prisma.creatorProfile.findUnique({ where: { handle: ctx.params.handle } });
  if (!profile) return notFound();
  await marketplaceService.unfollow(ctx.user.id, profile.userId);
  return ok({ followed: false });
});
