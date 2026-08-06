import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";
import { z } from "zod";

const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().optional()
});

const api = withApiHandler({ schema: ratingSchema });

// GET /api/prompt-rating/[promptId]
export const GET = api.GET(async (ctx) => {
  const ratings = await promptService.getRatings(ctx.params.id);
  return ok(ratings);
});

// POST /api/prompt-rating/[promptId]
export const POST = api.POST(async (ctx, body) => {
  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const result = await promptService.createRating(ctx.params.id, ctx.user.id, parsed.data);
  if (!result) return fail("NOT_FOUND", "Prompt not found");
  return ok({ ok: true });
});