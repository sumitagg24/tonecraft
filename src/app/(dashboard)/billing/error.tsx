"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { useEffect } from "react";

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Billing error", { name: error.name, message: error.message });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <ErrorFallback error={error} onRetry={reset} title="Billing error" showHome={false} />
    </div>
  );
}
