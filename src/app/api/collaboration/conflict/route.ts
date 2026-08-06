import { ok, withApiHandler } from "@/lib/withApiHandler";
import { collaborationService } from "@/services/CollaborationService";
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
  const result = await collaborationService.resolveConflict(body as Parameters<typeof collaborationService.resolveConflict>[0]);
  return ok(result);
});