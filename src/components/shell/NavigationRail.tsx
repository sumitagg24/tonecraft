"use client";
import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigationStore } from "@/stores/navigation-store";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { duration } from "@/styles/motion";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";
import {
  Plus, Command, PanelLeftClose, PanelLeftOpen, Sparkles,
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

  const isMobile = variant === "mobile";
  const collapsed = isMobile ? false : railCollapsed;

  const handleNewChat = async () => {
    const chat = await createChat();
    router.push(`/chat/${chat.id}`);
    onNavigate?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const count = NAV_ITEMS.length;
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
      aria-label="Primary"
      className={cn(
        "flex h-full flex-col border-r border-border/30 bg-sidebar/40 backdrop-blur-2xl transition-[width] duration-300",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      {/* Brand */}
      <div className={cn("flex items-center gap-2.5 px-4 py-4 border-b border-border/20", collapsed && "justify-center px-0")}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-glow shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-base tracking-tight gradient-text whitespace-nowrap">ToneCraft</span>
        )}
      </div>

      {/* Destinations */}
      <div className="flex-1 overflow-y-auto py-3 px-3" onKeyDown={handleKeyDown}>
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item, i) => {
            const active = isNavItemActive(item, pathname);
            const button = (
              <button
                key={item.id}
                ref={(el) => { itemRefs.current[i] = el; }}
                onClick={() => { router.push(item.href); onNavigate?.(); }}
                onFocus={() => setFocusIndex(i)}
                tabIndex={focusIndex === -1 ? (active ? 0 : -1) : focusIndex === i ? 0 : -1}
                className={cn(
                  "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                  collapsed ? "justify-center px-0 py-3 w-full" : "px-3 py-2.5 w-full",
                  active
                    ? "bg-muted/50 border border-border/40 shadow-sm text-foreground"
                    : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className={cn("w-[18px] h-[18px] shrink-0", active && "text-primary")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.shortcut && (
                  <kbd className="ml-auto text-micro font-mono text-muted-foreground/50 border border-border/30 rounded px-1.5 py-0.5">
                    ⌘{item.shortcut}
                  </kbd>
                )}
              </button>
            );
            return <div key={item.id}>{label(item, button)}</div>;
          })}
        </div>
      </div>

      {/* Global actions */}
      <div className="shrink-0 px-3 py-3 border-t border-border/20 flex flex-col gap-1">
        <button
          onClick={handleNewChat}
          className={cn(
            "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow",
            collapsed ? "justify-center px-0 py-3 w-full" : "px-3 py-2.5 w-full"
          )}
          title={collapsed ? "New Chat (⌘N)" : undefined}
        >
          <Plus className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>New Chat</span>}
          {!collapsed && <kbd className="ml-auto text-micro font-mono opacity-60 border border-white/20 rounded px-1.5 py-0.5">⌘N</kbd>}
        </button>
        <button
          onClick={() => { toggle(); onNavigate?.(); }}
          className={cn(
            "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent",
            collapsed ? "justify-center px-0 py-3 w-full" : "px-3 py-2.5 w-full"
          )}
          title={collapsed ? "Command palette (⌘K)" : undefined}
        >
          <Command className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Command</span>}
          {!collapsed && <kbd className="ml-auto text-micro font-mono text-muted-foreground/50 border border-border/30 rounded px-1.5 py-0.5">⌘K</kbd>}
        </button>
      </div>

      {/* Collapse toggle (desktop only) */}
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
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed inset-y-0 left-0 z-50 w-[240px] md:hidden"
          >
            <NavigationRail variant="mobile" onNavigate={() => setMobileNavOpen(false)} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
