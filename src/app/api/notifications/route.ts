import { ok, withApiHandler } from "@/lib/withApiHandler";
import { notificationService } from "@/services/NotificationService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const limit = Number(ctx.request.nextUrl.searchParams.get("limit") ?? "20");
  const [notifications, unread] = await Promise.all([
    notificationService.list(ctx.user.id, Math.min(Math.max(limit, 1), 50)),
    notificationService.unreadCount(ctx.user.id),
  ]);
  return ok({ notifications, unread });
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id } = (body ?? {}) as { id?: string };
  if (id) {
    await notificationService.markRead(ctx.user.id, id);
  } else {
    await notificationService.markAllRead(ctx.user.id);
  }
  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const clear = ctx.request.nextUrl.searchParams.get("all") === "true";
  if (clear) {
    await notificationService.clearAll(ctx.user.id);
  }
  return ok({ ok: true });
});
