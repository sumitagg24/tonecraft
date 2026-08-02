import { useState, useEffect, useCallback } from "react";
import type { UserPreferences } from "@/types";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const defaultPreferences: UserPreferences = {
  preferredLanguage: "english",
  preferredTone: "professional",
  preferredPlatform: "email",
  preferredStyle: "standard",
  preferredModel: "auto",
  creativityLevel: 70,
  responseLength: "medium",
  autoSave: true,
  streamingEnabled: true,
  darkMode: false,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<UserPreferences>("/api/preferences")
      .then((data) => setPreferences({ ...defaultPreferences, ...data }))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePreference = useCallback(async (key: keyof UserPreferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    try {
      await api("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch {
      setPreferences((prev) => ({ ...prev, [key]: defaultPreferences[key] }));
      toast.error("Failed to save preference");
    }
  }, []);

  const updatePreferences = useCallback(async (prefs: Partial<UserPreferences>) => {
    const prev = preferences;
    setPreferences((p) => ({ ...p, ...prefs }));
    try {
      await api("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
    } catch {
      setPreferences(prev);
      toast.error("Failed to save preferences");
    }
  }, [preferences]);

  return { preferences, loading, updatePreference, updatePreferences };
}
