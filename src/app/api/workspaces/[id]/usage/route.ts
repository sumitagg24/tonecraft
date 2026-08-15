import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { usageService } from "@/services/UsageService";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";
import { logger } from "@/lib/logger";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const type = ctx.request.nextUrl.searchParams.get("type") ?? undefined;
  const from = ctx.request.nextUrl.searchParams.get("from") ?? undefined;
  const to = ctx.request.nextUrl.searchParams.get("to") ?? undefined;
  
  const isMember = await permissionMiddleware.isWorkspaceMember(id, ctx.user.id);
  if (!isMember) return fail("FORBIDDEN", "You are not a member of this workspace", 403);
  
  const usage = await usageService.getWorkspaceUsage(id, {
    type,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });
  return ok(usage);
});

export const POST = api.POST(async (ctx, body) => {
  const { id } = ctx.params;
  const usageData = body as {
    type: string;
    amount: number;
    workspaceId?: string;
    userId?: string;
    timestamp?: string;
  };
  
  const isMember = await permissionMiddleware.isWorkspaceMember(id, ctx.user.id);
  if (!isMember) return fail("FORBIDDEN", "You are not a member of this workspace", 403);
  
  try {
    const usage = await usageService.trackUsage(
      usageData.userId || ctx.user.id,
      usageData.type,
      usageData.amount
    );
    return ok(usage, 201);
  } catch (e) {
    logger.error("[API] Failed to record usage", { userId: ctx.user.id }, e instanceof Error ? e : undefined);
    return fail("ERROR", "Failed to record usage", 500);
  }
});