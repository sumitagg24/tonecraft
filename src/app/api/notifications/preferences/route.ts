import { ok, withApiHandler } from "@/lib/withApiHandler";
import { notificationService } from "@/services/NotificationService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const prefs = await notificationService.getPreferences(ctx.user.id);
  return ok(prefs);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const prefs = await notificationService.updatePreferences(ctx.user.id, (body ?? {}) as Record<string, boolean>);
  return ok(prefs);
});
