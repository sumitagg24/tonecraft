"use client";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MOBILE_NAV_ITEMS, isNavItemActive } from "./nav-items";

export function MobileBottomBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 border-t border-border/30 bg-sidebar/80 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-full items-stretch">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-micro font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className={cn("w-5 h-5", active && "text-primary")} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
