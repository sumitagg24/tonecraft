"use client";

import { useState, useEffect, useCallback } from "react";

export interface UsageHistoryData {
  summary: {
    plan: string;
    role: string;
    credits: {
      allocated: number | null;
      used: number;
      remaining: number | null;
      unlimited: boolean;
    };
    dailyUsed: number;
    totalOperations: number;
    allowedOperations: number;
    deniedOperations: number;
  };
  period: {
    start: string;
    end: string;
  };
  dailyBreakdown: Array<{
    date: string;
    credits: number;
    operations: number;
    allowed: number;
    denied: number;
  }>;
  byOperation: Array<{
    operation: string;
    credits: number;
    count: number;
  }>;
  recentEvents: Array<{
    id: string;
    operation: string;
    model: string | null;
    credits: number;
    allowed: boolean;
    createdAt: string;
  }>;
}

interface UseUsageHistoryResult {
  data: UsageHistoryData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useUsageHistory(): UseUsageHistoryResult {
  const [data, setData] = useState<UsageHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/usage/history");
      if (!res.ok) {
        if (res.status === 401) {
          setLoading(false);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setError(null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
