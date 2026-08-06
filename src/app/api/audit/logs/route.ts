import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const listSchema = z.object({
  workspaceId: z.string().optional(),
  actorId: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  perPage: z.coerce.number().min(1).max(100).optional(),
});

const recordSchema = z.object({
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  workspaceId: z.string().optional(),
  targetId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const api = withApiHandler({ schema: recordSchema });

function parseDate(str: string | null): Date | undefined {
  if (!str) return undefined;
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
}

export const GET = api.GET(async (ctx) => {
  const sp = ctx.request.nextUrl.searchParams;
  const parsed = listSchema.safeParse({
    workspaceId: sp.get("workspaceId") ?? undefined,
    actorId: sp.get("actorId") ?? undefined,
    resource: sp.get("resource") ?? undefined,
    action: sp.get("action") ?? undefined,
    page: sp.get("page") ?? undefined,
    perPage: sp.get("perPage") ?? undefined,
  });

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid query parameters", 400, parsed.error.issues);
  }

  const fromDate = parseDate(sp.get("fromDate"));
  const toDate = parseDate(sp.get("toDate"));

  const { items, total } = await auditLogService.list({
    ...parsed.data,
    fromDate,
    toDate,
  });

  return ok({ items, total });
});

export const POST = api.POST(async (ctx, body) => {
  const { action, resource, resourceId, workspaceId, targetId, metadata } =
    body as {
      action: string;
      resource: string;
      resourceId?: string;
      workspaceId?: string;
      targetId?: string;
      metadata?: Record<string, unknown>;
    };

  const ip = ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = ctx.request.headers.get("user-agent") ?? null;

  await auditLogService.record(action as Parameters<typeof auditLogService.record>[0], resource, {
    actorId: ctx.user.id,
    resourceId,
    workspaceId,
    targetId,
    ip,
    userAgent,
    metadata,
  });

  return ok({ ok: true }, 201);
});
