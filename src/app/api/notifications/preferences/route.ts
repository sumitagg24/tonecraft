import { ok, withApiHandler } from "@/lib/withApiHandler";
import { notificationService } from "@/services/NotificationService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const prefs = await notificationService.getPreferences(ctx.user.id);
  return ok(prefs);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const prefs = await notificationService.updatePreferences(ctx.user.id, (body ?? {}) as Record<string, unknown>);
  return ok(prefs);
});

export const POST = api.POST(async (ctx, body) => {
  const { endpoint, keys } = body as { endpoint: string; keys: Record<string, string> };
  if (!endpoint || !keys) {
    return ok({ ok: false, error: "endpoint and keys are required" }, 400);
  }
  const sub = await notificationService.savePushSubscription(ctx.user.id, endpoint, keys);
  return ok(sub, 201);
});
