import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { marketplaceService } from "@/services/MarketplaceService";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
});

const api = withApiHandler({ feature: "marketplace", rateLimit: { key: "marketplace", limit: 30 } });

// GET /api/marketplace/listings/[id]/reviews
export const GET = api.GET(async (ctx) => {
  const reviews = await prisma.listingReview.findMany({
    where: { listingId: ctx.params.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  return ok(reviews);
});

// POST /api/marketplace/listings/[id]/reviews
export const POST = api.POST(async (ctx, body) => {
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const item = await marketplaceService.review(ctx.params.id, ctx.user.id, parsed.data.rating, parsed.data.review);
  if (!item) return fail("REVIEW_REJECTED", "Cannot review this listing", 422);
  return ok(item, 201);
});
