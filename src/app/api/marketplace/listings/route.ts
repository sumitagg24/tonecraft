import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { marketplaceService } from "@/services/MarketplaceService";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const listQuerySchema = z.object({
  kind: z.enum(["prompt", "agent", "workflow", "persona", "template"]).optional(),
  q: z.string().max(100).optional(),
  sort: z.enum(["trending", "recent", "popular", "rating"]).optional(),
  tag: z.string().max(50).optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
});

const publishSchema = z.object({
  kind: z.enum(["prompt", "agent", "workflow", "persona", "template"]),
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  content: z.record(z.string(), z.unknown()),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  license: z.string().max(40).optional(),
  priceCredits: z.number().int().min(0).max(1_000_000).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const api = withApiHandler({ feature: "marketplace", rateLimit: { key: "marketplace", limit: 60 } });

// GET /api/marketplace/listings?kind=&q=&sort=&tag=&page=&perPage=
export const GET = api.GET(async (ctx) => {
  const url = new URL(ctx.request.url);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid marketplace query parameters", 400);
  }
  const data = await marketplaceService.list({
    ...parsed.data,
    authorId: url.searchParams.get("authorId") ?? undefined,
  });
  return ok(data);
});

// POST /api/marketplace/listings
export const POST = api.POST(async (ctx, body) => {
  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const listing = await marketplaceService.create(ctx.user.id, parsed.data);
  await auditLogService.record("marketplace.publish", "marketplace_listing", {
    actorId: ctx.user.id,
    resourceId: listing.id,
    metadata: { kind: listing.kind, title: listing.title },
  });
  return ok(listing, 201);
});
