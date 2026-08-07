import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { memoryService } from "@/services/MemoryService";
import { z } from "zod";

const graphSchema = z.object({
  ownerType: z.enum(["user", "workspace", "team", "agent"]),
  ownerId: z.string().min(1),
});

const api = withApiHandler({ feature: "memory" });

// GET /api/memory/graph?ownerType=&ownerId=
export const GET = api.GET(async (ctx) => {
  const url = new URL(ctx.request.url);
  const parsed = graphSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid graph query", 400);
  const ownerId = parsed.data.ownerId === "me" ? ctx.user.id : parsed.data.ownerId;
  const graph = await memoryService.graph(parsed.data.ownerType, ownerId);
  return ok(graph);
});
