import { ok, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";

const api = withApiHandler({});

export const GET = api.GET(async (ctx) => {
  const query = ctx.request.nextUrl.searchParams.get("q") || "";
  const category = ctx.request.nextUrl.searchParams.get("category") || undefined;
  const isFavorite = ctx.request.nextUrl.searchParams.get("favorite");
  
  const tags = ctx.request.nextUrl.searchParams.get("tags")?.split(",") || [];
  
  const filters = {
    category,
    isFavorite: isFavorite ? isFavorite === "true" : undefined,
    tags: tags.length > 0 ? tags : undefined
  };
  
  const results = await promptService.searchPrompts(ctx.user.id, query, filters);
  return ok(results);
});