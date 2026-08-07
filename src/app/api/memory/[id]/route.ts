import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { memoryService } from "@/services/MemoryService";

const api = withApiHandler({ feature: "memory" });

// DELETE /api/memory/[id]
export const DELETE = api.DELETE(async (ctx) => {
  const removed = await memoryService.remove(ctx.params.id);
  if (!removed) return notFound();
  return ok({ removed: true });
});
