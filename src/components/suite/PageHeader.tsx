"use client";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "default" | "dense" | "with-action" | "centered";
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  variant = "default",
  className = "",
}: PageHeaderProps) {
  const isDense = variant === "dense";
  const isCentered = variant === "centered";
  const descriptionId = description ? `page-header-desc-${title.toLowerCase().replace(/\s+/g, "-")}` : undefined;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between gap-4 mb-6 py-2 px-1",
        isCentered ? "items-center text-center sm:text-left" : "sm:items-center",
        className
      )}
    >
      <div className={cn("flex items-center gap-3 min-w-0", isCentered && "flex-col sm:flex-row")}>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-brand-foreground shrink-0 shadow-[0_6px_18px_-6px_hsl(var(--brand)/0.55)]"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {isDense ? (
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
          ) : (
            <h1
              className="text-2xl sm:text-[28px] font-bold tracking-tight text-foreground"
              aria-describedby={descriptionId}
            >
              {title}
            </h1>
          )}
          {!isDense && description && (
            <p id={descriptionId} className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}

