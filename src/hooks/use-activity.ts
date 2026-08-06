"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { ActivityFilter, ActivitySummary } from "@/services/ActivityService";

export function useActivity(filter: ActivityFilter) {
  const [data, setData] = useState<{ items: ActivitySummary[]; total: number } | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams();
    if (filter.projectId) params.set("projectId", filter.projectId);
    if (filter.chatId) params.set("chatId", filter.chatId);
    if (filter.userId) params.set("userId", filter.userId);
    if (filter.type) params.set("type", filter.type);
    if (filter.page) params.set("page", String(filter.page));
    if (filter.perPage) params.set("perPage", String(filter.perPage));
    if (filter.fromDate) params.set("fromDate", filter.fromDate.toISOString());
    if (filter.toDate) params.set("toDate", filter.toDate.toISOString());

    const enabled = !!(filter.projectId || filter.chatId || filter.userId);
    if (!enabled) {
      setData(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api<{ items: ActivitySummary[]; total: number }>(`/api/activity?${params.toString()}`)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filter)]);

  return { data, isLoading, error };
}

export function useActivityAggregation(filter: { projectId?: string; userId?: string }) {
  const [data, setData] = useState<{ byType: Array<{ type: string; _count: { id: number } }>; total: number } | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams();
    if (filter.projectId) params.set("projectId", filter.projectId);
    if (filter.userId) params.set("userId", filter.userId);

    const enabled = !!(filter.projectId || filter.userId);
    if (!enabled) {
      setData(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api<{ byType: Array<{ type: string; _count: { id: number } }>; total: number }>(
      `/api/activity/aggregate?${params.toString()}`
    )
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filter)]);

  return { data, isLoading, error };
}

export function useRecordActivity() {
  return {
    mutate: (data: {
      userId: string;
      projectId?: string;
      chatId?: string;
      type: string;
      title: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }) =>
      api<ActivitySummary>("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  };
}
