import { ok, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";
import { promptSchema } from "@/lib/validators";

const api = withApiHandler({ schema: promptSchema });

export const GET = api.GET(async (ctx) => {
  const projectId = ctx.request.nextUrl.searchParams.get("projectId") || undefined;
  const prompts = await promptService.listPrompts(ctx.user.id, projectId);
  const categories = await promptService.listCategories(ctx.user.id);
  return ok({ prompts, categories });
});

export const POST = api.POST(async (ctx, body) => {
  const prompt = await promptService.createPrompt(ctx.user.id, body as typeof promptSchema._output);
  return ok(prompt, 201);
});
