import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { memoryService } from "@/services/MemoryService";

const api = withApiHandler({ feature: "memory" });

// DELETE /api/memory/[id]
export const DELETE = api.DELETE(async (ctx) => {
  // Scoped to the caller's own memories — a bare id must not delete someone else's.
  const removed = await memoryService.remove(ctx.params.id, ctx.user.id);
  if (!removed) return notFound();
  return ok({ removed: true });
});
