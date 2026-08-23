import { logger } from "@/lib/logger";

/**
 * Web Push delivery (VAPID) — real browser push for notifications.
 *
 * Contract (same fail-closed convention as rate limiting / SMTP):
 *  - Production: missing VAPID keys make send() THROW so callers (the
 *    notification service) log a visible delivery failure instead of
 *    silently dropping pushes.
 *  - Dev: missing keys warn and skip (permissive local development).
 *
 * Keys are read lazily at send time so tests can set/delete env vars without
 * module-cache gymnastics, and so boot never fails when push isn't wired up.
 */
export interface PushSubscriptionLike {
  endpoint: string;
  keys: Record<string, string>;
}

function isConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

/**
 * Send a push notification to one subscription. Throws when delivery fails or
 * when VAPID is unconfigured in production (fail closed). Returns the
 * web-push send result so callers can prune invalid (410 Gone) endpoints.
 */
export async function sendWebPush(sub: PushSubscriptionLike, payload: { title: string; body?: string; url?: string }) {
  if (!isConfigured()) {
    const message = "Web Push is not configured (VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT missing)";
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }
    logger.warn(`[webpush] ${message} — skipping`);
    return null;
  }

  // web-push is CommonJS — its API lives on the default export.
  const mod = await import("web-push");
  const webpush = (mod.default ?? mod) as typeof import("web-push");

  // isConfigured() already guaranteed these are present.
  const subject = process.env.VAPID_SUBJECT ?? "";
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
  webpush.setVapidDetails(subject, publicKey, privateKey);

  return webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
    JSON.stringify({ title: payload.title, body: payload.body ?? "", url: payload.url ?? "/notifications" })
  );
}

/** The applicationServerKey (VAPID public key) the browser needs to subscribe. */
export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}
