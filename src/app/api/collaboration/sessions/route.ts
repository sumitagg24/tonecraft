import { ok, withApiHandler } from "@/lib/withApiHandler";
import { collaborationService } from "@/services/CollaborationService";
import { z } from "zod";

const createSchema = z.object({
  projectId: z.string().optional(),
  chatId: z.string().optional(),
  resourceType: z.string(),
  resourceId: z.string(),
  participants: z.array(z.string()),
});

const api = withApiHandler({ schema: createSchema });

export const POST = api.POST(async (ctx, body) => {
  const session = await collaborationService.createSession(body as Parameters<typeof collaborationService.createSession>[0]);
  return ok(session, 201);
});

export const GET = api.GET(async (ctx) => {
  const sp = ctx.request.nextUrl.searchParams;
  const resourceType = sp.get("resourceType") ?? undefined;
  const resourceId = sp.get("resourceId") ?? undefined;
  if (resourceType && resourceId) {
    const session = await collaborationService.getActiveSession(resourceType, resourceId);
    return ok({ session });
  }
  return ok({ session: null });
});