import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { promptService } from "@/services/PromptService";
import { collectionSchema, collectionUpdateSchema } from "@/lib/validators";

const api = withApiHandler({ schema: collectionSchema });

export const GET = api.GET(async (ctx) => {
  const includePublic = ctx.request.nextUrl.searchParams.get("includePublic") === "true";
  const collections = await promptService.listCollections(ctx.user.id, includePublic);
  return ok(collections);
});

export const POST = api.POST(async (ctx, body) => {
  const collection = await promptService.createCollection(ctx.user.id, body as typeof collectionSchema._output);
  return ok(collection, 201);
});

export const PATCH = api.PATCH(async (ctx) => {
  const { id } = ctx.params;
  const body = await ctx.request.json();
  const parsed = collectionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i: any) => i.message).join("; "), 400);
  }
  const updated = await promptService.updateCollection(id, ctx.user.id, parsed.data);
  if (!updated) return notFound();
  return ok(updated);
});

export const DELETE = api.DELETE(async (ctx) => {
  const { id } = ctx.params;
  const success = await promptService.deleteCollection(id, ctx.user.id);
  if (!success) return notFound();
  return ok({ ok: true });
});

// GET /api/prompts/collections/[id] - Get collection
export const GET_BY_ID = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const collection = await promptService.getCollection(id);
  if (!collection) return notFound();
  return ok(collection);
});

// POST /api/prompts/collections/[id]/items - Add prompt to collection
export const ADD_ITEM = api.POST(async (ctx) => {
  const { id } = ctx.params;
  const { promptId } = await ctx.request.json() as { promptId: string };
  const result = await promptService.addPromptToCollection(promptId, id, ctx.user.id);
  if (!result) return notFound();
  return ok(result);
});

// DELETE /api/prompts/collections/[id]/items/[promptId] - Remove prompt from collection
export const REMOVE_ITEM = api.DELETE(async (ctx) => {
  const { id, promptId } = ctx.params;
  const success = await promptService.removePromptFromCollection(id, promptId, ctx.user.id);
  if (!success) return notFound();
  return ok({ ok: true });
});

// GET /api/prompts/collections/[id]/items - List collection items
export const LIST_ITEMS = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const collection = await prisma.promptCollection.findUnique({ where: { id } });
  if (!collection) return notFound();
  return ok(collection);
});

// POST /api/prompts/collections/[id]/share - Share collection
export const SHARE = api.POST(async (ctx) => {
  const { id } = ctx.params;
  const { sharedWith, permission } = await ctx.request.json() as { sharedWith: string; permission?: string };
  const result = await promptService.shareCollection(id, ctx.user.id, sharedWith, permission);
  return ok(result);
});