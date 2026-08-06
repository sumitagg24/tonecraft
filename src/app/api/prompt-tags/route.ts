import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";
import { z } from "zod";

const tagSchema = z.object({
  name: z.string().min(1).max(50)
});

const api = withApiHandler({ schema: z.any() });

// GET /api/prompt-tags - List all tags
export const GET = api.GET(async (ctx) => {
  const tags = await promptService.getPopularTags(10);
  return ok(tags);
});

// POST /api/prompt-tags/[promptId] - Add tag to prompt
export const POST = api.POST(async (ctx, body) => {
  const { promptId, tagName } = (body ?? {}) as { promptId: string; tagName: string };
  const result = await promptService.addTag(promptId, tagName, ctx.user.id);
  return ok(result);
});

// GET /api/prompt-tags/[tag] - Get prompts with specific tag
export const GET_BY_TAG = api.GET(async (ctx) => {
  const tag = ctx.params.tag;
  const prompts = await promptService.getTags(ctx.params.id);
  return ok(prompts);
});