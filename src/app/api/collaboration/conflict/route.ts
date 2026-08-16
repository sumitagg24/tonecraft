import { fail, ok, withApiHandler } from "@/lib/withApiHandler";
import { collaborationService } from "@/services/CollaborationService";
import { canAccessResource } from "@/lib/resource-access";
import { z } from "zod";

const resolveSchema = z.object({
  resourceType: z.enum(["project", "chat"]),
  resourceId: z.string(),
  baseVersion: z.number(),
  incomingOps: z.array(z.record(z.string(), z.unknown())),
  currentContent: z.record(z.string(), z.unknown()),
});

const api = withApiHandler({ schema: resolveSchema });

export const POST = api.POST(async (ctx, body) => {
  const b = body as z.infer<typeof resolveSchema>;
  // Authorization: conflict resolution reads another user's pending document
  // operations — only allow it on resources the caller can access.
  if (!(await canAccessResource(ctx.user.id, b.resourceType, b.resourceId))) {
    return fail("NOT_FOUND", "Resource not found", 404);
  }
  const result = await collaborationService.resolveConflict(b);
  return ok(result);
});
