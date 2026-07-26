import { SkeletonShimmer } from "@/components/ui/effects/PremiumLoading";
import { cn } from "@/lib/utils";

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonShimmer className="h-7 w-48" />
          <SkeletonShimmer className="h-4 w-72" />
        </div>
        <SkeletonShimmer className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border/20 p-5">
            <SkeletonShimmer className="h-5 w-32 mb-3" />
            <SkeletonShimmer className="h-3 w-full mb-2" />
            <SkeletonShimmer className="h-3 w-3/4" />
          </div>
        ))}
      </div>
      <SkeletonShimmer className="h-48 w-full rounded-xl" />
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border/20 p-5", className)}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonShimmer className="h-10 w-10 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <SkeletonShimmer className="h-4 w-24" />
          <SkeletonShimmer className="h-3 w-16" />
        </div>
      </div>
      <SkeletonShimmer className="h-3 w-full mb-2" />
      <SkeletonShimmer className="h-3 w-5/6 mb-2" />
      <SkeletonShimmer className="h-3 w-2/3" />
    </div>
  );
}

export function ListSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <SkeletonShimmer className="h-8 w-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <SkeletonShimmer className="h-3.5 w-3/4" />
            <SkeletonShimmer className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex h-screen">
      <div className="w-72 border-r border-border/20 p-4 space-y-3">
        <SkeletonShimmer className="h-8 w-32 mb-6" />
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonShimmer key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
      <div className="flex-1 p-6 space-y-6">
        <PageSkeleton />
      </div>
    </div>
  );
}
