import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";
import { z } from "zod";

const collectionCreateSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

const api = withApiHandler({ schema: collectionCreateSchema });

// GET /api/prompt-collections - List collections
export const GET = api.GET(async (ctx) => {
  const includePublic = ctx.request.nextUrl.searchParams.get("includePublic") === "true";
  const collections = await promptService.listCollections(ctx.user.id, includePublic);
  return ok(collections);
});

// POST /api/prompt-collections - Create collection
export const POST = api.POST(async (ctx, body) => {
  const parsed = collectionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const collection = await promptService.createCollection(ctx.user.id, parsed.data);
  return ok(collection, 201);
});