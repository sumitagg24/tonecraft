import { ok, forbidden, withApiHandler } from "@/lib/withApiHandler";
import { activityService } from "@/services/ActivityService";
import { canAccessProject } from "@/lib/resource-access";
import { z } from "zod";

const listSchema = z.object({
  projectId: z.string().optional(),
  chatId: z.string().optional(),
  userId: z.string().optional(),
  type: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  perPage: z.coerce.number().min(1).max(100).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

const recordSchema = z.object({
  userId: z.string(),
  projectId: z.string().optional(),
  chatId: z.string().optional(),
  type: z.string(),
  title: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const getApi = withApiHandler({ schema: listSchema });
const postApi = withApiHandler({ schema: recordSchema });

export const GET = getApi.GET(async (ctx) => {
  const url = new URL(ctx.request.url);
  const fromDate = url.searchParams.get("fromDate");
  const toDate = url.searchParams.get("toDate");
  const requestedUserId = url.searchParams.get("userId") || undefined;

  // Security: users can only query their own activity (or their project's).
  if (requestedUserId && requestedUserId !== ctx.user.id) {
    return forbidden();
  }

  const projectId = url.searchParams.get("projectId") || undefined;
  if (projectId && !(await canAccessProject(ctx.user.id, projectId))) {
    return forbidden();
  }

  const filter = {
    projectId: url.searchParams.get("projectId") || undefined,
    chatId: url.searchParams.get("chatId") || undefined,
    userId: ctx.user.id,
    type: url.searchParams.get("type") || undefined,
    page: Number(url.searchParams.get("page")) || 1,
    perPage: Number(url.searchParams.get("perPage")) || 20,
    fromDate: fromDate ? new Date(fromDate) : undefined,
    toDate: toDate ? new Date(toDate) : undefined,
  };
  const { items, total } = await activityService.list(filter);
  return ok({ items, total });
});

export const POST = postApi.POST(async (ctx, body) => {
  // Security: always use the authenticated user's ID, never trust client-supplied userId.
  const activity = await activityService.record({
    ...(body as Parameters<typeof activityService.record>[0]),
    userId: ctx.user.id,
  });
  return ok(activity, 201);
});