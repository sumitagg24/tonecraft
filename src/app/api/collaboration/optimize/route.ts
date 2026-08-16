import { fail, ok, withApiHandler } from "@/lib/withApiHandler";
import { optimizeCollaborationStorage } from "@/lib/socket-storage";
import { isGlobalAdmin } from "@/lib/admin";

const api = withApiHandler();

/**
 * On-demand collaboration-storage optimization. This is a GLOBAL maintenance
 * operation — it prunes presences, typing indicators, sessions, and excess
 * version snapshots / document operations across every user. Previously any
 * authenticated user could trigger it; now it requires a global admin
 * (ADMIN_EMAILS). The same cleanup also runs on a schedule via the daily
 * retention worker.
 */
export const POST = api.POST(async (ctx) => {
  if (!(await isGlobalAdmin(ctx.user.id))) {
    return fail("FORBIDDEN", "Admin access required", 403);
  }
  const result = await optimizeCollaborationStorage();
  return ok(result);
});
