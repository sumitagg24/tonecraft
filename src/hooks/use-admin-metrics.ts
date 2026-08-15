"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

/**
 * Client-side plumbing shared by the `/admin` dashboard pages: resolving the
 * current workspace, fetching a workspace-scoped admin endpoint, and the
 * loading / toast-on-failure states around it.
 */

/** Period options offered by the metrics pages (matches the API's `period`). */
export const METRIC_PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

export const DEFAULT_METRIC_PERIOD = "30d";

/** Resolves the workspace the admin pages operate on (the user's first one). */
export async function fetchCurrentWorkspaceId(): Promise<string | null> {
  const workspaces = await api<Array<{ id: string }>>("/api/workspaces");
  return workspaces?.[0]?.id ?? null;
}

export interface AdminMetricsResult<T> {
  data: T | null;
  loading: boolean;
  /** Re-runs the fetch — wire to "Refresh" buttons. */
  refetch: () => void;
  /** For mutations that need the workspace the data was loaded for. */
  getWorkspaceId: () => Promise<string | null>;
}

export interface AdminMetricsOptions<T, R = T> {
  /** Builds the endpoint path from the resolved workspace id. */
  path: (workspaceId: string) => string;
  /** Toast shown when the request fails. */
  errorMessage: string;
  /** Optional projection of the raw response into page-shaped state. */
  select?: (raw: R) => T;
}

/**
 * Fetches a workspace-scoped admin endpoint, re-fetching whenever `path`
 * changes (e.g. when the selected period changes) — so callers must memoize
 * `path` with `useCallback`.
 */
export function useAdminMetrics<T, R = T>({
  path,
  errorMessage,
  select,
}: AdminMetricsOptions<T, R>): AdminMetricsResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const workspaceId = await fetchCurrentWorkspaceId();
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const raw = await api<R>(path(workspaceId));
      setData(select ? select(raw) : (raw as unknown as T));
    } catch {
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
    // `select` is inlined by callers; only `path` drives re-fetching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, errorMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    refetch: fetchData,
    getWorkspaceId: fetchCurrentWorkspaceId,
  };
}
