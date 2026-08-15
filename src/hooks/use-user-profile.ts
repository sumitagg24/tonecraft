import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { logger } from "@/lib/logger";

export interface UserProfileData {
  subscription: string;
  loading: boolean;
}

export function useUserProfile(): UserProfileData {
  const [subscription, setSubscription] = useState<string>("FREE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<{ label: string }>("/api/subscription")
      .then((res) => {
        if (cancelled) return;
        if (res?.label) setSubscription(res.label.toUpperCase());
      })
      .catch((error: unknown) => {
        // Non-fatal: the UI keeps the FREE default, but the failure must be visible.
        logger.error(
          "[profile] failed to load subscription",
          undefined,
          error instanceof Error ? error : new Error(String(error))
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { subscription, loading };
}
