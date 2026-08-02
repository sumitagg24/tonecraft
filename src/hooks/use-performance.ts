"use client";
import { useEffect, useRef, useCallback } from "react";
import { logger } from "@/lib/logger";

export function usePerformanceMonitor() {
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
  }, []);

  const mark = useCallback((label: string) => {
    performance.mark(label);
  }, []);

  const measure = useCallback((label: string, startMark: string) => {
    try {
      performance.measure(label, startMark);
      const entries = performance.getEntriesByName(label, "measure");
      if (entries.length > 0) {
        logger.debug(`Performance: ${label} = ${entries[0].duration.toFixed(1)}ms`);
      }
    } catch {
      // mark/measure not supported
    }
  }, []);

  return { mark, measure };
}