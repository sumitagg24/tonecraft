import { fail, forbidden, ok, withApiHandler } from "@/lib/withApiHandler";
import { versionHistoryService } from "@/services/VersionHistoryService";
import { canAccessResource } from "@/lib/resource-access";
import { z } from "zod";

const createSchema = z.object({
  resourceType: z.string(),
  resourceId: z.string(),
  title: z.string().optional(),
  content: z.record(z.string(), z.unknown()),
  diff: z.record(z.string(), z.unknown()).optional(),
  changeType: z.string(),
  changeSummary: z.string().optional(),
  isAuto: z.boolean().optional(),
  parentId: z.string().optional(),
});

const api = withApiHandler({ schema: createSchema });

export const POST = api.POST(async (ctx, body) => {
  const input = body as z.infer<typeof createSchema>;
  if (!(await canAccessResource(input.resourceType, input.resourceId, ctx.user.id))) return forbidden();

  const snapshot = await versionHistoryService.createSnapshot({ ...input, userId: ctx.user.id });
  return ok(snapshot, 201);
});

export const GET = api.GET(async (ctx) => {
  const sp = ctx.request.nextUrl.searchParams;
  const resourceType = sp.get("resourceType");
  const resourceId = sp.get("resourceId");
  if (!resourceType || !resourceId) return fail("VALIDATION_ERROR", "resourceType and resourceId are required", 400);
  if (!(await canAccessResource(resourceType, resourceId, ctx.user.id))) return forbidden();

  const page = Number(sp.get("page")) || 1;
  const perPage = Number(sp.get("perPage")) || 20;
  const { items, total } = await versionHistoryService.listVersions(resourceType, resourceId, page, perPage);
  return ok({ items, total });
});
