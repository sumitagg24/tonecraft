/* ToneCraft PWA service worker.
 * Strategy:
 *  - Development: complete no-op. Turbopack dev chunks change in place; caching
 *    them causes "module factory is not available", ChunkLoadError and
 *    "enqueueModel is not a function" errors after recompiles.
 *  - Production: network-first navigations with an offline fallback (no HTML
 *    caching), stale-while-revalidate for content-hashed static assets only,
 *    and push handling forwarded to the notifications page.
 */
const CACHE_NAME = "tonecraft-v3";
const OFFLINE_SHELL = "/offline";
const IS_DEV = ["localhost", "127.0.0.1"].includes(self.location.hostname);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (IS_DEV) return;
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Navigations: network-first, fall back to the offline shell. Never cache
  // HTML here — cached documents serve stale chunk manifests and break dev.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((hit) => hit || caches.match(OFFLINE_SHELL))
      )
    );
    return;
  }

  // Static assets only (hashed chunks, icons, fonts, manifest): stale-while-revalidate.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "ToneCraft", body: "", url: "/notifications" };
  try {
    data = event.data ? JSON.parse(event.data.text()) : data;
  } catch {
    /* ignore malformed push */
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "ToneCraft", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/notifications" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
