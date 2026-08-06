import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";

const api = withApiHandler({});

// GET /api/prompt-collections/[collectionId]
export const GET = api.GET(async (ctx) => {
  const collectionId = ctx.params.id;
  const collection = await promptService.getCollection(collectionId);
  if (!collection) return notFound();
  return ok(collection);
});

// PATCH /api/prompt-collections/[collectionId]
export const PATCH = api.PATCH(async (ctx) => {
  const collectionId = ctx.params.id;
  const parsed = await ctx.request.json();
  const updated = await promptService.updateCollection(collectionId, ctx.user.id, parsed);
  if (!updated) return notFound();
  return ok(updated);
});

// DELETE /api/prompt-collections/[collectionId]
export const DELETE = api.DELETE(async (ctx) => {
  const collectionId = ctx.params.id;
  const success = await promptService.deleteCollection(collectionId, ctx.user.id);
  if (!success) return notFound();
  return ok({ success: true });
});