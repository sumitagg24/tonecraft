import { forbidden, ok, withApiHandler } from "@/lib/withApiHandler";
import { collaborationService } from "@/services/CollaborationService";
import { canAccessChat, canAccessProject, canAccessResource } from "@/lib/resource-access";
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
  const input = body as z.infer<typeof createSchema>;
  if (!(await canAccessResource(input.resourceType, input.resourceId, ctx.user.id))) return forbidden();
  if (input.projectId && !(await canAccessProject(input.projectId, ctx.user.id))) return forbidden();
  if (input.chatId && !(await canAccessChat(input.chatId, ctx.user.id))) return forbidden();

  const session = await collaborationService.createSession(input);
  return ok(session, 201);
});

export const GET = api.GET(async (ctx) => {
  const sp = ctx.request.nextUrl.searchParams;
  const resourceType = sp.get("resourceType") ?? undefined;
  const resourceId = sp.get("resourceId") ?? undefined;
  if (resourceType && resourceId) {
    if (!(await canAccessResource(resourceType, resourceId, ctx.user.id))) return forbidden();
    const session = await collaborationService.getActiveSession(resourceType, resourceId);
    return ok({ session });
  }
  return ok({ session: null });
});
