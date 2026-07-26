"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error", { name: error.name, message: error.message, digest: error.digest });
  }, [error]);

  return <ErrorFallback error={error} onRetry={reset} />;
}
