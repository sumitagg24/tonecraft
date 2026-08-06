import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { getModelById } from "@/config/models";

export interface UserProfileData {
  subscription: string;
  model: string | undefined;
  loading: boolean;
}

export function useUserProfile(): UserProfileData {
  const [subscription, setSubscription] = useState<string>("FREE");
  const [model, setModel] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      api<{ label: string }>("/api/subscription"),
      api<{ preferredModel?: string }>("/api/preferences"),
    ]).then((results) => {
      if (cancelled) return;
      const [subRes, prefRes] = results;
      if (subRes.status === "fulfilled" && subRes.value?.label) {
        setSubscription(subRes.value.label.toUpperCase());
      }
      if (prefRes.status === "fulfilled" && prefRes.value?.preferredModel) {
        const id = prefRes.value.preferredModel;
        setModel(id === "auto" ? "Auto" : getModelById(id)?.displayName ?? id);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { subscription, model, loading };
}
