"use client";
import { useState, useEffect, useCallback } from "react";

interface UsageRecord {
  id: string;
  userId: string;
  type: string;
  amount: number;
  workspaceId: string | null;
  timestamp: string;
}

export function useWorkspaceUsage(workspaceId: string) {
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/usage`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to fetch usage");
      setUsage(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch usage");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const trackUsage = async (type: string, amount: number) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || "Failed to track usage");
      setUsage(prev => [result.data, ...prev]);
      return result.data;
    } catch (e) {
      console.error("Failed to track usage:", e);
      throw e;
    }
  };

  return { usage, loading, error, refetch: fetchUsage, trackUsage };
}