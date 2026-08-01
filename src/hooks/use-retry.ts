import { useCallback, useEffect, useRef, useState } from "react";

interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

const defaultConfig: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, maxDelay);
}

export function useRetry<T>(fn: () => Promise<T>, config?: RetryConfig) {
  const { maxRetries, baseDelay, maxDelay } = { ...defaultConfig, ...config };
  const [isRetrying, setIsRetrying] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (): Promise<T | null> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (controller.signal.aborted) return null;
      try {
        if (mountedRef.current) setIsRetrying(true);
        return await fn();
      } catch (err) {
        if (controller.signal.aborted) return null;
        if (attempt === maxRetries) {
          throw err;
        }
        const delay = calculateDelay(attempt, baseDelay, maxDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    return null;
  }, [fn, maxRetries, baseDelay, maxDelay]);

  return { execute, isRetrying };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
