"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { useRouter } from "next/navigation";

export default function DashboardNotFound() {
  const router = useRouter();
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <ErrorFallback
        title="Page not found"
        message="This dashboard page doesn't exist."
        showRetry={false}
        showHome
      />
    </div>
  );
}
