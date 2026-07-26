import { Suspense, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SuspenseBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
  </div>
);

const PageFallback = () => (
  <div className="space-y-6 p-6 animate-pulse">
    <div className="h-7 w-48 rounded-md bg-muted" />
    <div className="h-4 w-72 rounded-md bg-muted" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 rounded-xl bg-muted/40" />
      ))}
    </div>
    <div className="h-48 rounded-xl bg-muted/40" />
  </div>
);

const SectionFallback = () => (
  <div className="space-y-3 animate-pulse p-4">
    <div className="h-5 w-1/3 rounded-md bg-muted" />
    <div className="h-20 rounded-xl bg-muted/40" />
  </div>
);

export function SuspensePage({ children, fallback }: SuspenseBoundaryProps) {
  return <Suspense fallback={fallback ?? <PageFallback />}>{children}</Suspense>;
}

export function SuspenseSection({ children, fallback }: SuspenseBoundaryProps) {
  return <Suspense fallback={fallback ?? <SectionFallback />}>{children}</Suspense>;
}

export function SuspenseDefault({ children, fallback, name }: SuspenseBoundaryProps) {
  return <Suspense fallback={fallback ?? <DefaultFallback />}>{children}</Suspense>;
}
