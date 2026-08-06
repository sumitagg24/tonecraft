import { ok, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";

const api = withApiHandler({});

export const GET = api.GET(async (ctx) => {
  const prompts = await promptService.listPrompts(ctx.user.id);
  const favorites = prompts.filter(p => p.isFavorite);
  return ok(favorites);
});

export const POST = api.POST(async (ctx) => {
  const { promptId } = await ctx.request.json() as { promptId: string };
  await promptService.toggleFavorite(promptId, ctx.user.id);
  return ok({ ok: true });
});