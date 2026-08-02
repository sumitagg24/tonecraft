import { ok, withApiHandler } from "@/lib/withApiHandler";
import { searchService } from "@/services/SearchService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const query = ctx.request.nextUrl.searchParams.get("q") || "";
  const results = await searchService.search(ctx.user.id, query);
  return ok(results);
});
