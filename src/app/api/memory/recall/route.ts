import { ok, fail, forbidden, withApiHandler } from "@/lib/withApiHandler";
import { memoryService } from "@/services/MemoryService";
import { resolveMemoryOwner } from "@/lib/resource-access";
import { z } from "zod";

const recallSchema = z.object({
  ownerType: z.enum(["user", "workspace", "team", "agent"]),
  ownerId: z.string().min(1),
  query: z.string().max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const api = withApiHandler({ feature: "memory", rateLimit: { key: "memory", limit: 60 } });

// POST /api/memory/recall — semantic recall
export const POST = api.POST(async (ctx, body) => {
  const parsed = recallSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const ownerId = await resolveMemoryOwner(parsed.data.ownerType, parsed.data.ownerId, ctx.user.id);
  if (!ownerId) return forbidden();
  const results = await memoryService.recall({ ...parsed.data, ownerId });
  return ok(results);
});
