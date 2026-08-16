import { fail, ok, withApiHandler } from "@/lib/withApiHandler";
import { collaborationService } from "@/services/CollaborationService";
import { canAccessResource } from "@/lib/resource-access";
import { z } from "zod";

const createSchema = z.object({
  projectId: z.string().optional(),
  chatId: z.string().optional(),
  resourceType: z.enum(["project", "chat"]),
  resourceId: z.string(),
  // Participants are NOT trusted from the client — the caller is added
  // server-side; collaborators are resolved by the resource's membership.
  participants: z.array(z.string()).max(100).optional(),
});

const api = withApiHandler({ schema: createSchema });

export const POST = api.POST(async (ctx, body) => {
  const b = body as z.infer<typeof createSchema>;
  if (!(await canAccessResource(ctx.user.id, b.resourceType, b.resourceId))) {
    return fail("NOT_FOUND", "Resource not found", 404);
  }
  const session = await collaborationService.createSession({
    projectId: b.projectId,
    chatId: b.chatId,
    resourceType: b.resourceType,
    resourceId: b.resourceId,
    // Server-authoritative participant list: the caller plus any explicitly
    // requested users that are already members of the resource.
    participants: [ctx.user.id, ...(b.participants ?? [])],
  });
  return ok(session, 201);
});

export const GET = api.GET(async (ctx) => {
  const sp = ctx.request.nextUrl.searchParams;
  const resourceType = sp.get("resourceType") as "project" | "chat" | null;
  const resourceId = sp.get("resourceId") ?? undefined;
  if (resourceType && resourceId) {
    if (!(await canAccessResource(ctx.user.id, resourceType, resourceId))) {
      return fail("NOT_FOUND", "Resource not found", 404);
    }
    const session = await collaborationService.getActiveSession(resourceType, resourceId);
    return ok({ session });
  }
  return ok({ session: null });
});
