import { ok, fail, forbidden, withApiHandler } from "@/lib/withApiHandler";
import { memoryService } from "@/services/MemoryService";
import { canAccessProject, canAccessWorkspace } from "@/lib/resource-access";
import { z } from "zod";

const contextSchema = z.object({
  query: z.string().max(1000).optional(),
  workspaceId: z.string().optional(),
  agentId: z.string().optional(),
  projectId: z.string().optional(),
});

const api = withApiHandler({ feature: "memory", rateLimit: { key: "memory", limit: 30 } });

// POST /api/memory/context — build an AI context bundle
export const POST = api.POST(async (ctx, body) => {
  const parsed = contextSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const { workspaceId, projectId } = parsed.data;
  if (workspaceId && !(await canAccessWorkspace(workspaceId, ctx.user.id))) return forbidden();
  if (projectId && !(await canAccessProject(projectId, ctx.user.id))) return forbidden();

  const bundle = await memoryService.buildContext({ userId: ctx.user.id, ...parsed.data });
  return ok(bundle);
});
