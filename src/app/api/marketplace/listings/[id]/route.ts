import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { marketplaceService } from "@/services/MarketplaceService";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  license: z.string().max(40).optional(),
  priceCredits: z.number().int().min(0).max(1_000_000).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const api = withApiHandler({ feature: "marketplace", rateLimit: { key: "marketplace", limit: 60 } });

// GET /api/marketplace/listings/[id]
export const GET = api.GET(async (ctx) => {
  const listing = await marketplaceService.getById(ctx.params.id, ctx.user.id);
  if (!listing) return notFound();
  return ok(listing);
});

// PATCH /api/marketplace/listings/[id]
export const PATCH = api.PATCH(async (ctx, body) => {
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const updated = await marketplaceService.update(ctx.user.id, ctx.params.id, parsed.data);
  if (!updated) return notFound();
  await auditLogService.record("marketplace.update", "marketplace_listing", {
    actorId: ctx.user.id,
    resourceId: updated.id,
  });
  return ok(updated);
});

// DELETE /api/marketplace/listings/[id]
export const DELETE = api.DELETE(async (ctx) => {
  const removed = await marketplaceService.remove(ctx.user.id, ctx.params.id);
  if (!removed) return notFound();
  await auditLogService.record("marketplace.delete", "marketplace_listing", {
    actorId: ctx.user.id,
    resourceId: ctx.params.id,
  });
  return ok({ ok: true });
});
