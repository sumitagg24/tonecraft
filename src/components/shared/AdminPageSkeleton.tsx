import { cn } from "@/lib/utils";

/**
 * Loading placeholder shared by the `/admin` dashboard pages — a title bar plus
 * `count` shimmering blocks, laid out as a list by default or as a grid when
 * `gridClassName` (the column classes) is supplied.
 */
export function AdminPageSkeleton({
  count,
  itemClassName = "h-24",
  gridClassName,
}: {
  count: number;
  itemClassName?: string;
  gridClassName?: string;
}) {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
      <div className={gridClassName ? cn("grid gap-4", gridClassName) : "space-y-3"}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cn("bg-muted/10 rounded-xl animate-pulse", itemClassName)} />
        ))}
      </div>
    </div>
  );
}
