/**
 * Client-side Web Push subscription management.
 *
 * Called from the settings page when the user toggles "Push notifications".
 * - subscribePush(): fetches the VAPID public key, requests permission,
 *   creates a PushSubscription via the service worker, and persists it to
 *   /api/notifications/preferences so the server can send pushes.
 * - unsubscribePush(): unsubscribes locally and tells the server to drop the
 *   endpoint (it no longer needs to be stored — the endpoint is keyed on the
 *   subscription, and delete-on-unsubscribe keeps the table clean).
 *
 * Everything is progressive enhancement: any failure (no SW, no permission,
 * push unsupported, VAPID unconfigured) resolves to `false` and the caller
 * rolls the toggle back.
 */

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function subscribePush(): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }

    const reg = await navigator.serviceWorker.ready;

    // Fetch the VAPID applicationServerKey (auth-gated endpoint).
    const keyRes = await fetch("/api/notifications/vapid-key");
    if (!keyRes.ok) return false;
    const keyData = (await keyRes.json()) as { enabled: boolean; applicationServerKey?: string };
    if (!keyData.enabled || !keyData.applicationServerKey) return false;

    const existing = await reg.pushManager.getSubscription();
    let sub = existing;
    if (!sub) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;
      const keyBytes = urlBase64ToUint8Array(keyData.applicationServerKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes.buffer as ArrayBuffer,
      });
    }

    // Persist so the server can deliver. `toJSON()` gives { endpoint, keys }.
    const json = sub.toJSON();
    const endpoint = json.endpoint;
    const keys = json.keys as Record<string, string> | undefined;
    if (!endpoint || !keys) return false;

    const saveRes = await fetch("/api/notifications/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, keys }),
    });
    return saveRes.ok;
  } catch {
    return false;
  }
}

export async function unsubscribePush(): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return true;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      // Tell the server to drop the stored endpoint.
      await fetch("/api/notifications/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      }).catch(() => undefined);
    }
    return true;
  } catch {
    return false;
  }
}
