import { useCallback, useEffect, useRef, useState, startTransition } from "react";

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
  const abortRef = useRef<AbortController | null>(null);
  const retryCount = useRef(0);
  const asyncFnRef = useRef(asyncFn);

  useEffect(() => {
    asyncFnRef.current = asyncFn;
  }, [asyncFn]);

  const execute = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    mountedRef.current = true;
    retryCount.current += 1;

    const run = async () => {
      startTransition(() => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
      });
      try {
        const result = await asyncFnRef.current(controller.signal);
        if (mountedRef.current) {
          startTransition(() => {
            setState({ data: result, error: null, isLoading: false });
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (mountedRef.current) {
          startTransition(() => {
            setState({
              data: null,
              error: err instanceof Error ? err : new Error(String(err)),
              isLoading: false,
            });
          });
        }
      }
    };

    run();

    return () => { controller.abort(); };
  }, []);

  const depsKey = JSON.stringify(deps);
  useEffect(() => {
    const cleanup = execute();
    return () => {
      mountedRef.current = false;
      cleanup?.();
    };
  }, [execute, depsKey]);

  return { ...state, refetch: execute };
}
