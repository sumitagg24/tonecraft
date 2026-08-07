import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { marketplaceService } from "@/services/MarketplaceService";
import { auditLogService } from "@/services/AuditLogService";

const api = withApiHandler({ feature: "marketplace", rateLimit: { key: "marketplace", limit: 30 } });

// POST /api/marketplace/listings/[id]/download
export const POST = api.POST(async (ctx) => {
  const listing = await marketplaceService.download(ctx.params.id, ctx.user.id);
  if (!listing) return notFound();
  await auditLogService.record("marketplace.download", "marketplace_listing", {
    actorId: ctx.user.id,
    resourceId: listing.id,
  });
  return ok(listing);
});
