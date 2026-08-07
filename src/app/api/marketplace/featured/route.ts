import { ok, withApiHandler } from "@/lib/withApiHandler";
import { marketplaceService } from "@/services/MarketplaceService";

const api = withApiHandler({ feature: "marketplace" });

// GET /api/marketplace/featured
export const GET = api.GET(async () => {
  const items = await marketplaceService.featured();
  return ok(items);
});
