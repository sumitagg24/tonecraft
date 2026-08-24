"use client";

import { useState, useEffect, useCallback } from "react";

export interface CreditData {
  plan: string;
  role: string;
  credits: {
    monthly: {
      allocated: number | null;
      used: number;
      remaining: number | null;
      unlimited: boolean;
    };
    daily: {
      allocated: number | null;
      used: number;
      remaining: number | null;
      unlimited: boolean;
    };
  };
  resetDate: string;
}

interface UseCreditsResult {
  data: CreditData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches the current user's credit usage from /api/usage.
 * Polls every 60 seconds to keep the counter fresh.
 */
export function useCredits(pollIntervalMs = 60_000): UseCreditsResult {
  const [data, setData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) {
        if (res.status === 401) {
          // Not signed in — don't show an error, just no data
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
    const interval = setInterval(fetchData, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchData, pollIntervalMs]);

  return { data, loading, error, refresh: fetchData };
}
