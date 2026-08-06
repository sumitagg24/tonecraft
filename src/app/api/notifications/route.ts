import { ok, withApiHandler } from "@/lib/withApiHandler";
import { notificationService } from "@/services/NotificationService";
import { NotificationType } from "@prisma/client";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const sp = ctx.request.nextUrl.searchParams;
  const limit = Number(sp.get("limit") ?? "20");
  const type = sp.get("type") as NotificationType | null;
  const unreadOnly = sp.get("unread") === "true";

  const [notifications, unread] = await Promise.all([
    notificationService.list(ctx.user.id, limit, type ?? undefined, unreadOnly),
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

export const POST = api.POST(async (ctx, body) => {
  const { type, title, body: notifBody, link, metadata, workspaceId } = body as {
    type?: NotificationType;
    title?: string;
    body?: string | null;
    link?: string | null;
    metadata?: Record<string, unknown> | null;
    workspaceId?: string | null;
  };

  if (!type || !title) {
    return ok({ ok: false, error: "type and title are required" }, 400);
  }

  const created = await notificationService.create({
    userId: ctx.user.id,
    type,
    title,
    body: notifBody ?? null,
    link: link ?? null,
    metadata: metadata ?? null,
    workspaceId: workspaceId ?? null,
  });
  return ok({ ok: created });
});
