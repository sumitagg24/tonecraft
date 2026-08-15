import { fail, type ApiHandlerContext, type ApiResult } from "./withApiHandler";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";

/**
 * Shared server-side plumbing for the workspace-admin endpoints
 * (`/api/admin/**`): the `workspaceId` query param + admin role gate, and the
 * `period` → `since` window used by every metrics route.
 */

/** Days covered by each supported `period` query value. */
const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

export const DEFAULT_PERIOD = "30d";

export interface AdminScope {
  workspaceId: string;
}

export type AdminScopeResult = { ok: true; scope: AdminScope } | { ok: false; error: ApiResult<never> };

/**
 * Reads `workspaceId` from the query string and verifies the caller is an admin
 * of that workspace. Routes return `result.error` verbatim when `ok` is false.
 */
export async function requireWorkspaceAdmin(
  ctx: ApiHandlerContext,
  options: { forbiddenMessage?: string } = {}
): Promise<AdminScopeResult> {
  const workspaceId = ctx.request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return { ok: false, error: fail("BAD_REQUEST", "workspaceId is required", 400) };
  }

  const role = await permissionMiddleware.checkWorkspaceRole(workspaceId, ctx.user.id, "admin");
  if (role !== "admin") {
    return {
      ok: false,
      error: fail("FORBIDDEN", options.forbiddenMessage ?? "Admin access required", 403),
    };
  }

  return { ok: true, scope: { workspaceId } };
}

export interface MetricsPeriod {
  /** The normalized period token echoed back in responses. */
  period: string;
  days: number;
  /** Start of the window — `now - days`. */
  since: Date;
}

/** Resolves the `period` query param (7d/30d/90d, default 30d) into a window. */
export function resolveMetricsPeriod(ctx: ApiHandlerContext): MetricsPeriod {
  const period = ctx.request.nextUrl.searchParams.get("period") || DEFAULT_PERIOD;
  const days = PERIOD_DAYS[period] ?? PERIOD_DAYS[DEFAULT_PERIOD];
  return { period, days, since: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
}
