import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { memoryService } from "@/services/MemoryService";
import { z } from "zod";

const createSchema = z.object({
  ownerType: z.enum(["user", "workspace", "team", "agent"]),
  ownerId: z.string().min(1),
  content: z.string().min(1).max(4000),
  metadata: z.record(z.string(), z.unknown()).optional(),
  importance: z.number().int().min(0).max(100).optional(),
});

const listSchema = z.object({
  ownerType: z.enum(["user", "workspace", "team", "agent"]),
  ownerId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const api = withApiHandler({ feature: "memory", rateLimit: { key: "memory", limit: 60 } });

// GET /api/memory?ownerType=&ownerId=&limit= — list recent memories
// `ownerId=me` resolves to the authenticated user's id.
export const GET = api.GET(async (ctx) => {
  const url = new URL(ctx.request.url);
  const parsed = listSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid memory query", 400);
  const ownerId = parsed.data.ownerId === "me" ? ctx.user.id : parsed.data.ownerId;
  const items = await memoryService.list(parsed.data.ownerType, ownerId, parsed.data.limit);
  return ok(items);
});

// POST /api/memory — remember a fact
export const POST = api.POST(async (ctx, body) => {
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const ownerId = parsed.data.ownerId === "me" ? ctx.user.id : parsed.data.ownerId;
  const item = await memoryService.remember({ ...parsed.data, ownerId });
  return ok(item, 201);
});

// POST /api/memory/clear?ownerType=&ownerId= — wipe an owner's memory
const clearSchema = z.object({
  ownerType: z.enum(["user", "workspace", "team", "agent"]),
  ownerId: z.string().min(1),
});

export const DELETE = api.DELETE(async (ctx) => {
  const url = new URL(ctx.request.url);
  const parsed = clearSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid memory clear query", 400);
  const ownerId = parsed.data.ownerId === "me" ? ctx.user.id : parsed.data.ownerId;
  const cleared = await memoryService.clear(parsed.data.ownerType, ownerId);
  return ok({ cleared });
});

// NOTE: semantic recall lives at /api/memory/recall (separate route file).
