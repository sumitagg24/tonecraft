import { ok, withApiHandler } from "@/lib/withApiHandler";
import { marketplaceService } from "@/services/MarketplaceService";

const api = withApiHandler({ feature: "marketplace" });

// GET /api/marketplace/tags
export const GET = api.GET(async () => {
  const tags = await marketplaceService.popularTags();
  return ok(tags);
});
