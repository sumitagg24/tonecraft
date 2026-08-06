import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";

const api = withApiHandler({});

// GET /api/prompt-search - Search prompts
export const GET = api.GET(async (ctx) => {
  const query = ctx.request.nextUrl.searchParams.get("query") ?? "";
  const filters = {
    category: ctx.request.nextUrl.searchParams.get("category") ?? undefined,
    isFavorite: ctx.request.nextUrl.searchParams.get("isFavorite") === "true",
    tags: ctx.request.nextUrl.searchParams.get("tags")?.split(",") || []
  };
  
  const results = await promptService.searchPrompts(ctx.user.id, query, filters);
  return ok(results);
});