"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export function useWebVitals() {
  useEffect(() => {
    if (typeof window === "undefined" || !("performance" in window)) return;

    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          logger.info(`[WebVital] ${entry.name}: ${entry.startTime.toFixed(1)}ms`, {
            duration: entry.duration,
            entryType: entry.entryType,
          });
        }
      });

      observer.observe({ type: "largest-contentful-paint", buffered: true });
      observer.observe({ type: "first-input", buffered: true });
      observer.observe({ type: "layout-shift", buffered: true });
    } catch {
      /* browser compatibility fallback */
    }
  }, []);
}
