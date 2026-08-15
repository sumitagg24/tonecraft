"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { logger } from "@/lib/logger";

/**
 * Phase 12.8 — client-side feature gating.
 * Fetches the current user's runtime-enabled feature keys once and exposes a
 * `has(key)` helper so the shell can hide feature-gated navigation items
 * (marketplace, memory, developer API) without a deployment.
 */
export function useEnabledFeatures() {
  const [features, setFeatures] = useState<string[] | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ features: string[] }>("/api/features/me");
      setFeatures(data.features);
    } catch (error) {
      // Fall back to showing everything — the server still enforces gates.
      logger.warn("[features] failed to load enabled features, showing all", {
        error: error instanceof Error ? error.message : String(error),
      });
      setFeatures(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const has = useCallback(
    (key: string): boolean => {
      if (features === null) return true; // unknown → show (server enforces)
      return features.includes(key);
    },
    [features],
  );

  return { features, has, refresh };
}
