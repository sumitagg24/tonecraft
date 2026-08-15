import { forbidden, ok, withApiHandler } from "@/lib/withApiHandler";
import { collaborationService } from "@/services/CollaborationService";
import { canAccessResource } from "@/lib/resource-access";
import { z } from "zod";

const resolveSchema = z.object({
  resourceType: z.string(),
  resourceId: z.string(),
  baseVersion: z.number(),
  incomingOps: z.array(z.record(z.string(), z.unknown())),
  currentContent: z.record(z.string(), z.unknown()),
});

const api = withApiHandler({ schema: resolveSchema });

export const POST = api.POST(async (ctx, body) => {
  const input = body as z.infer<typeof resolveSchema>;
  if (!(await canAccessResource(input.resourceType, input.resourceId, ctx.user.id))) return forbidden();
  const result = await collaborationService.resolveConflict(input);
  return ok(result);
});
