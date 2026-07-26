import { useCallback, useEffect, useRef, useState } from "react";

interface SafeAsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useSafeAsync<T>(
  asyncFn: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
) {
  const [state, setState] = useState<SafeAsyncState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });
  const mountedRef = useRef(true);
  const retryCount = useRef(0);

  const execute = useCallback(async () => {
    const controller = new AbortController();
    mountedRef.current = true;
    retryCount.current += 1;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await asyncFn(controller.signal);
      if (mountedRef.current) {
        setState({ data: result, error: null, isLoading: false });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (mountedRef.current) {
        setState({
          data: null,
          error: err instanceof Error ? err : new Error(String(err)),
          isLoading: false,
        });
      }
    }

    return () => controller.abort();
  }, deps);

  useEffect(() => {
    const cleanup = execute();
    return () => {
      mountedRef.current = false;
      cleanup.then((abort) => abort?.());
    };
  }, [execute]);

  return { ...state, refetch: execute };
}
