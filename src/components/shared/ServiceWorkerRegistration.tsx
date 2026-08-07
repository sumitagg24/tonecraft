"use client";

import { useEffect } from "react";
import { useOfflineStore } from "@/stores/offline-store";

/**
 * Phase 15 — PWA install/offline wiring.
 * Registers the service worker (cache + push) and keeps the offline store's
 * online flag in sync with browser connectivity events. Renders nothing.
 */
export function ServiceWorkerRegistration() {
  const setOnline = useOfflineStore((s) => s.setOnline);

  useEffect(() => {
    // Only register in production: in dev, Turbopack recompiles chunks in place
    // and an intercepting service worker causes ChunkLoadError / stale-module
    // failures. (The sw.js itself is also a dev no-op as a belt-and-braces guard.)
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* SW is progressive enhancement — fail silently */
      });
    }

    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [setOnline]);

  return null;
}
