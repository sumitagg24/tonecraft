"use client";

import Link from "next/link";
import { useCredits } from "@/hooks/use-credits";
import { cn } from "@/lib/utils";
import { Zap, Infinity, ArrowUpRight } from "lucide-react";

interface CreditCounterProps {
  collapsed?: boolean;
}

/** Format the reset date as a short string like "Sep 1" or "Resets tomorrow". */
function formatResetDate(isoDate: string): string {
  const reset = new Date(isoDate);
  const now = new Date();
  const diffMs = reset.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Resets today";
  if (diffDays === 1) return "Resets tomorrow";
  if (diffDays <= 7) return `Resets in ${diffDays}d`;
  return reset.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Plan badge color mapping. */
function planColor(plan: string, role: string): string {
  if (role === "OWNER") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  switch (plan) {
    case "pro":
      return "bg-violet-500/15 text-violet-400 border-violet-500/20";
    case "enterprise":
      return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    default:
      return "bg-muted/60 text-muted-foreground border-border/40";
  }
}

/** Display label for the plan. */
function planLabel(plan: string, role: string): string {
  if (role === "OWNER") return "Owner";
  switch (plan) {
    case "pro":
      return "Pro";
    case "enterprise":
      return "Enterprise";
    default:
      return "Free";
  }
}

export function CreditCounter({ collapsed = false }: CreditCounterProps) {
  const { data, loading } = useCredits();

  // Don't render while loading or if no data
  if (loading || !data) return null;

  const { plan, role, credits } = data;
  const { monthly } = credits;
  const isUnlimited = monthly.unlimited;

  // Calculate progress percentage
  const percentage = isUnlimited
    ? 0
    : monthly.allocated && monthly.allocated > 0
      ? Math.min(100, Math.round((monthly.used / monthly.allocated) * 100))
      : 0;

  // Warning states
  const isLow = !isUnlimited && percentage >= 80;
  const isEmpty = !isUnlimited && monthly.remaining !== null && monthly.remaining <= 0;

  // Collapsed view — just a tiny icon indicator
  if (collapsed) {
    return (
      <Link
        href="/billing"
        className={cn(
          "flex items-center justify-center rounded-xl p-2 transition-all hover:bg-muted/40",
          isEmpty && "text-destructive",
          isLow && !isEmpty && "text-amber-400",
        )}
        title={`${monthly.used} / ${monthly.allocated ?? "∞"} credits used`}
      >
        {isUnlimited ? (
          <Infinity className="w-4 h-4" />
        ) : (
          <div className="relative w-5 h-5">
            <svg viewBox="0 0 20 20" className="w-5 h-5 -rotate-90">
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="opacity-15"
              />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 8}`}
                strokeDashoffset={`${2 * Math.PI * 8 * (1 - percentage / 100)}`}
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-500",
                  isEmpty ? "text-destructive" : isLow ? "text-amber-400" : "text-brand",
                )}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
              {percentage}
            </span>
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/billing"
      className={cn(
        "group flex flex-col gap-2.5 rounded-xl border p-3 transition-all duration-200",
        "hover:bg-muted/30 hover:border-border/60",
        isEmpty
          ? "border-destructive/30 bg-destructive/5"
          : isLow
            ? "border-amber-500/20 bg-amber-500/5"
            : "border-border/30 bg-muted/20",
      )}
    >
      {/* Plan badge + reset date */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            planColor(plan, role),
          )}
        >
          <Zap className="w-2.5 h-2.5" />
          {planLabel(plan, role)}
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          {isUnlimited ? "Unlimited" : formatResetDate(data.resetDate)}
        </span>
      </div>

      {/* Credit count */}
      <div className="flex items-baseline gap-1.5">
        {isUnlimited ? (
          <>
            <Infinity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Unlimited credits</span>
          </>
        ) : (
          <>
            <span className={cn(
              "text-sm font-bold tabular-nums",
              isEmpty ? "text-destructive" : isLow ? "text-amber-400" : "text-foreground",
            )}>
              {monthly.remaining}
            </span>
            <span className="text-xs text-muted-foreground/60">
              / {monthly.allocated} left
            </span>
          </>
        )}
      </div>

      {/* Progress bar */}
      {!isUnlimited && (
        <div className="h-1 w-full rounded-full bg-muted/40 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isEmpty ? "bg-destructive" : isLow ? "bg-amber-400" : "bg-brand",
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Upgrade CTA when low or empty */}
      {(isEmpty || (isLow && plan === "free")) && (
        <span className="flex items-center gap-1 text-[10px] font-medium text-brand group-hover:underline">
          {isEmpty ? "Upgrade to continue" : "Upgrade for more"}
          <ArrowUpRight className="w-3 h-3" />
        </span>
      )}
    </Link>
  );
}
