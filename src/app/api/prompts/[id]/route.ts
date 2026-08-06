import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";
import { promptRatingSchema, promptSchema, promptUpdateSchema } from "@/lib/validators";

const api = withApiHandler({});

// GET /api/prompts - List prompts
export const GET = api.GET(async (ctx) => {
  const projectId = ctx.request.nextUrl.searchParams.get("projectId") || undefined;
  const prompts = await promptService.listPrompts(ctx.user.id, projectId);
  return ok({ prompts, categories: await promptService.listCategories(ctx.user.id) });
});

// POST /api/prompts - Create prompt
export const POST = api.POST(async (ctx, body) => {
  const prompt = await promptService.createPrompt(ctx.user.id, body as typeof promptSchema._output);
  return ok(prompt, 201);
});

// GET /api/prompts/[id] - Get specific prompt
export const GET_BY_ID = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const prompt = await promptService.getPrompt(id, ctx.user.id);
  if (!prompt) return notFound();
  return ok(prompt);
});

// PATCH /api/prompts/[id] - Update prompt
export const PATCH = api.PATCH(async (ctx, body) => {
  const { id } = ctx.params;
  const parsed = promptUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const okResult = await promptService.updatePrompt(id, ctx.user.id, parsed.data);
  if (!okResult) return notFound();
  return ok({ ok: true });
});

// DELETE /api/prompts/[id] - Delete prompt
export const DELETE = api.DELETE(async (ctx) => {
  const { id } = ctx.params;
  const okResult = await promptService.deletePrompt(id, ctx.user.id);
  if (!okResult) return notFound();
  return ok({ ok: true });
});

// GET /api/prompts/[id]/versions - List prompt versions
export const GET_VERSIONS = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const versions = await promptService.listVersions(ctx.params.id);
  return ok(versions);
});

// GET /api/prompts/[id]/versions/[versionId] - Get specific version
export const GET_VERSION = api.GET(async (ctx) => {
  const { id, version } = ctx.params;
  const versionData = await promptService.getVersion(ctx.params.id, Number(ctx.params.version));
  if (!versionData) return notFound();
  return ok(versionData);
});

// POST /api/prompts/[id]/ratings - Add rating to prompt
export const POST_RATING = api.POST(async (ctx) => {
  const { id } = ctx.params;
  const body = await ctx.request.json();
  const parsed = promptRatingSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const result = await promptService.createRating(ctx.params.id, ctx.user.id, parsed.data);
  return ok({ ok: true });
});

// GET /api/prompts/[id]/ratings - Get ratings for prompt
export const GET_RATINGS = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const ratings = await promptService.getRatings(ctx.params.id);
  return ok(ratings);
});

// GET /api/prompts/[id]/tags - Get tags for prompt
export const GET_TAGS = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const tags = await promptService.getTags(ctx.params.id);
  return ok(tags);
});

// POST /api/prompts/[id]/tags - Add tag to prompt
export const ADD_TAG = api.POST(async (ctx) => {
  const { id } = ctx.params;
  const { tag } = await ctx.request.json();
  const result = await promptService.addTag(ctx.params.id, tag, ctx.user.id);
  return ok(result);
});

// POST /api/prompts/[id]/share - Share prompt
export const SHARE_PROMPT = api.POST(async (ctx, body) => {
  const { sharedWith, permission = "view", expiresAt } = (body ?? {}) as {
    sharedWith: string;
    permission?: "view" | "edit" | "manage";
    expiresAt?: string;
  };
  const result = await promptService.sharePrompt(ctx.params.id, ctx.user.id, {
    sharedWith,
    permission,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined
  });
  return ok(result);
});