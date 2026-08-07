import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { marketplaceService } from "@/services/MarketplaceService";

const api = withApiHandler({ feature: "marketplace" });

// GET /api/marketplace/creators/[handle]
export const GET = api.GET(async (ctx) => {
  const profile = await marketplaceService.creatorByHandle(ctx.params.handle, ctx.user.id);
  if (!profile) return notFound();
  return ok(profile);
});
