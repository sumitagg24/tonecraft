"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { useEffect } from "react";
import { reportError } from "@/lib/error-reporting";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error", { name: error.name, message: error.message, digest: error.digest });
    // Route-boundary errors also reach the error monitor (Sentry) — the server
    // `onRequestError` hook may not see these depending on the render path.
    reportError(error, { digest: error.digest, extra: { source: "app-error-boundary" } });
  }, [error]);

  return <ErrorFallback error={error} onRetry={reset} />;
}
