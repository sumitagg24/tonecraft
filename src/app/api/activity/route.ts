import { forbidden, ok, withApiHandler } from "@/lib/withApiHandler";
import { activityService } from "@/services/ActivityService";
import { canAccessChat, canAccessProject } from "@/lib/resource-access";
import { z } from "zod";

const listSchema = z.object({
  projectId: z.string().optional(),
  chatId: z.string().optional(),
  type: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  perPage: z.coerce.number().min(1).max(100).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

const recordSchema = z.object({
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
  const projectId = url.searchParams.get("projectId") || undefined;
  const chatId = url.searchParams.get("chatId") || undefined;

  // Project/chat feeds are only readable by someone with access to them; every
  // other feed is scoped to the caller (a client-supplied userId is ignored).
  if (projectId && !(await canAccessProject(projectId, ctx.user.id))) return forbidden();
  if (chatId && !(await canAccessChat(chatId, ctx.user.id))) return forbidden();

  const filter = {
    projectId,
    chatId,
    userId: projectId || chatId ? undefined : ctx.user.id,
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
  const input = body as z.infer<typeof recordSchema>;
  if (input.projectId && !(await canAccessProject(input.projectId, ctx.user.id))) return forbidden();
  if (input.chatId && !(await canAccessChat(input.chatId, ctx.user.id))) return forbidden();

  const activity = await activityService.record({ ...input, userId: ctx.user.id });
  return ok(activity, 201);
});
