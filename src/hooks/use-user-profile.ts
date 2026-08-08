import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";

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
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { subscription, loading };
}
