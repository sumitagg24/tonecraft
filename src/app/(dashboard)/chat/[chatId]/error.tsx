"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { useEffect } from "react";

export default function ChatDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Conversation error", { name: error.name, message: error.message });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <ErrorFallback
        error={error}
        onRetry={reset}
        title="Conversation error"
        message="Failed to load this conversation. Please try again."
        showHome={false}
      />
    </div>
  );
}
