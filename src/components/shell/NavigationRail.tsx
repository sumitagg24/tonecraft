"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigationStore } from "@/stores/navigation-store";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { duration } from "@/styles/motion";
import { NAV_SECTIONS, NAV_ITEMS, isNavItemActive, type NavItem } from "./nav-items";
import { useEnabledFeatures } from "@/hooks/use-enabled-features";
import { Logo } from "@/components/shared/Logo";
import {
  Plus, Command, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavigationRailProps {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}

export function NavigationRail({ variant, onNavigate }: NavigationRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { railCollapsed, toggleRailCollapsed } = useNavigationStore();
  const { toggle } = useCommandPalette();
  const { createChat } = useChat();
  const [focusIndex, setFocusIndex] = useState(-1);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { has } = useEnabledFeatures();

  const isMobile = variant === "mobile";
  const collapsed = isMobile ? false : railCollapsed;

  const visibleSections = NAV_SECTIONS
    .map((section) => ({ ...section, items: section.items.filter((item: NavItem) => !item.feature || has(item.feature)) }))
    .filter((section) => section.items.length > 0);
  const visibleItems = visibleSections.flatMap((s) => s.items);
  const navIndexById = new Map(visibleItems.map((item, i) => [item.id, i]));
  const visibleCount = visibleItems.length;

  const handleNewChat = async () => {
    const chat = await createChat();
    router.push(`/chat/${chat.id}`);
    onNavigate?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const count = visibleCount;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      const next = (focusIndex + dir + count) % count;
      setFocusIndex(next);
      itemRefs.current[next]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const next = e.key === "Home" ? 0 : count - 1;
      setFocusIndex(next);
      itemRefs.current[next]?.focus();
    }
  };

  const label = (item: (typeof NAV_ITEMS)[number], content: React.ReactNode) =>
    collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
      </Tooltip>
    ) : content;

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "flex h-full flex-col border-r border-border/40 bg-sidebar/60 backdrop-blur-xl transition-[width] duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Brand Logo — clicking it always returns to the landing page */}
      <div className={cn("flex items-center gap-2.5 px-4 py-5 border-b border-border/30", collapsed && "justify-center px-0")}>
        <Link href="/" aria-label="ToneCraft home" className="hover:opacity-90 transition-opacity">
          <Logo size={collapsed ? "sm" : "md"} iconOnly={collapsed} />
        </Link>
      </div>

      {/* Destinations */}
      <div className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin" onKeyDown={handleKeyDown}>
        <div className="flex flex-col gap-1">
          {visibleSections.map((section) => {
            return (
              <div key={section.id} className="flex flex-col">
                {!collapsed && (
                  <div className="px-3 pt-3.5 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                      {section.label}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => {
                    const i = navIndexById.get(item.id) ?? 0;
                    const active = isNavItemActive(item, pathname);
                    const button = (
                      <motion.button
                        key={item.id}
                        ref={(el) => { itemRefs.current[i] = el; }}
                        onClick={() => { router.push(item.href); onNavigate?.(); }}
                        onFocus={() => setFocusIndex(i)}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.985 }}
                        transition={{ duration: 0.15 }}
                        tabIndex={focusIndex === -1 ? (active ? 0 : -1) : focusIndex === i ? 0 : -1}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                          collapsed ? "justify-center px-0 py-3 w-full" : "px-3 py-2.5 w-full",
                          active
                            ? "text-background font-semibold"
                            : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {active && (
                          <motion.div
                            layoutId="activeNavRailHighlight"
                            className="absolute inset-0 rounded-xl bg-foreground shadow-editorial z-0"
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        <item.icon className={cn("relative z-10 w-[18px] h-[18px] shrink-0 transition-colors", active ? "text-background" : "text-muted-foreground")} />
                        {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
                      </motion.button>
                    );
                    return <div key={item.id}>{label(item, button)}</div>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global actions */}
      <div className="shrink-0 px-3 py-3 border-t border-border/30 flex flex-col gap-1.5">
        <button
          onClick={handleNewChat}
          className={cn(
            "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 text-background bg-foreground hover:bg-foreground/90 shadow-editorial",
            collapsed ? "justify-center px-0 py-3 w-full" : "px-3 py-2.5 w-full"
          )}
          title={collapsed ? "New Workspace" : undefined}
        >
          <Plus className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>New Workspace</span>}
        </button>
        <button
          onClick={() => { toggle(); onNavigate?.(); }}
          className={cn(
            "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/40",
            collapsed ? "justify-center px-0 py-3 w-full" : "px-3 py-2.5 w-full"
          )}
          title={collapsed ? "Command palette" : undefined}
        >
          <Command className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Search</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      {!isMobile && (
        <button
          onClick={toggleRailCollapsed}
          className="shrink-0 mx-3 mb-3 h-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-all"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      )}
    </nav>
  );
}

export function MobileRailDrawer() {
  const { mobileNavOpen, setMobileNavOpen } = useNavigationStore();
  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed inset-y-0 left-0 z-50 w-[250px] md:hidden"
          >
            <NavigationRail variant="mobile" onNavigate={() => setMobileNavOpen(false)} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
