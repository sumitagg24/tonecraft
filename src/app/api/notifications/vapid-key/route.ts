import { ok, withApiHandler } from "@/lib/withApiHandler";
import { getVapidPublicKey } from "@/lib/webpush";

/**
 * Serves the VAPID applicationServerKey to authenticated clients so they can
 * create a push subscription (PushManager.subscribe). Auth-required: a
 * public key alone can't send pushes (that needs the private key, which
 * never leaves the server), but gating keeps the key from being harvested
 * by anonymous scrapers.
 */
const api = withApiHandler();

export const GET = api.GET(async () => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return ok({ enabled: false }, 200);
  }
  return ok({ enabled: true, applicationServerKey: publicKey });
});
