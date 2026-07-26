"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { useEffect } from "react";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Chat error", { name: error.name, message: error.message });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <ErrorFallback
        error={error}
        onRetry={reset}
        title="Chat error"
        message="Failed to load conversations. Please try again."
        showHome={false}
      />
    </div>
  );
}
