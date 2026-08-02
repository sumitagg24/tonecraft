import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { knowledgeService } from "@/services/KnowledgeService";

const api = withApiHandler();

export const POST = api.POST(async (ctx, body) => {
  const { query, fileIds } = body as { query?: string; fileIds?: string[] };
  if (!query || !query.trim()) return fail("BAD_REQUEST", "Query is required", 400);
  const chunks = await knowledgeService.retrieve(ctx.user.id, query, fileIds);
  return ok({ chunks });
});
