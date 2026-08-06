"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { VersionSnapshot } from "@/services/VersionHistoryService";

export function useVersionHistory(resourceType: string, resourceId: string) {
  const [data, setData] = useState<{ items: VersionSnapshot[]; total: number } | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!resourceType || !resourceId) {
      setData(undefined);
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams();
    params.set("resourceType", resourceType);
    params.set("resourceId", resourceId);
    params.set("perPage", "20");

    setIsLoading(true);
    api<{ items: VersionSnapshot[]; total: number }>(`/api/versions?${params.toString()}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resourceType, resourceId]);

  return { data, isLoading, error };
}

export function useCreateSnapshot() {
  return {
    mutate: (data: {
      resourceType: string;
      resourceId: string;
      userId: string;
      title?: string;
      content: Record<string, unknown>;
      diff?: Record<string, unknown>;
      changeType: string;
      changeSummary?: string;
      isAuto?: boolean;
    }) =>
      api<VersionSnapshot>("/api/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  };
}

export function useRestoreVersion() {
  return {
    mutate: async (id: string) => {
      const res = await api<{ content: Record<string, unknown>; version: number; changeType: string; changeSummary?: string }>(
        `/api/versions/${id}/restore`,
        { method: "POST" }
      );
      return res;
    },
  };
}

export function useDeleteVersion() {
  return {
    mutate: (id: string) => api(`/api/versions/${id}`, { method: "DELETE" }),
  };
}
