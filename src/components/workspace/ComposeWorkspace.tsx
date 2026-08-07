"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/styles/motion";
import { ConversationSidebar } from "./ConversationSidebar";
import { ProjectSidebar } from "./ProjectSidebar";
import { AIContextPanel } from "./AIContextPanel";
import { useChatStore } from "@/stores/chat-store";
import { PanelRightOpen, PanelRightClose, PanelLeftOpen, PanelLeftClose, Search, X } from "lucide-react";

interface ComposeWorkspaceProps {
  children: React.ReactNode;
}

const SIDEBAR_WIDTH = 280;
const CONTEXT_WIDTH = 320;

export function ComposeWorkspace({ children }: ComposeWorkspaceProps) {
  const pathname = usePathname();
  const {
    mode, sidebarOpen, contextPanelOpen, mobileSidebarOpen, mobileContextOpen,
    toggleSidebar, toggleContextPanel,
    setMobileSidebarOpen, setMobileContextOpen,
  } = useWorkspaceStore();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reduced = useReducedMotion();

  // `reduced ? { duration: 0 } : transition`
  const t = (transition: { duration: number; ease?: unknown } | object) =>
    reduced ? { duration: 0 } : transition;

  // Centered conversation search — toggled from the header search button.
  const [searchOpen, setSearchOpen] = useState(false);
  const searchQuery = useChatStore((s) => s.searchQuery);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, [setSearchQuery]);

  // Close mobile overlays on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
    setMobileContextOpen(false);
  }, [pathname, setMobileSidebarOpen, setMobileContextOpen]);

  const isFocus = mode === "focus" || mode === "writer";
  const sidebarActive = isMobile ? mobileSidebarOpen : sidebarOpen;
  const contextActive = isMobile ? mobileContextOpen : contextPanelOpen;

  const handleSidebarToggle = useCallback(() => {
    if (isMobile) setMobileSidebarOpen(!mobileSidebarOpen);
    else toggleSidebar();
  }, [isMobile, mobileSidebarOpen, setMobileSidebarOpen, toggleSidebar]);

  const handleContextToggle = useCallback(() => {
    if (isMobile) setMobileContextOpen(!mobileContextOpen);
    else toggleContextPanel();
  }, [isMobile, mobileContextOpen, setMobileContextOpen, toggleContextPanel]);

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* Desktop: conversation pane */}
      <motion.aside
        animate={{ width: sidebarOpen ? SIDEBAR_WIDTH : 0 }}
        transition={t({ duration: duration.normal, ease: ease.default })}
        className="hidden md:block shrink-0 overflow-hidden border-r border-border/30"
      >
        {sidebarOpen && (
          <div className="flex flex-col h-full">
            <div className="shrink-0 border-b border-border/10">
              <ProjectSidebar />
            </div>
            <div className="flex-1 min-h-0 border-t border-border/10">
              <ConversationSidebar />
            </div>
          </div>
        )}
      </motion.aside>

      {/* Mobile: conversation drawer */}
      <AnimatePresence>
        {isMobile && mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={t({ duration: duration.fast })}
              className="absolute inset-0 z-40 bg-black/50"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -SIDEBAR_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_WIDTH }}
              transition={t({ type: "spring", stiffness: 400, damping: 40 })}
              className="absolute inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] shadow-premium"
            >
              <ConversationSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Center column */}
      <div className="relative flex flex-1 flex-col min-w-0">
        {!isFocus && (
          <div className="shrink-0 h-12 flex items-center justify-between px-3 sm:px-4 border-b border-border/20 bg-background/40 backdrop-blur-sm">
            <button
              onClick={handleSidebarToggle}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-all shrink-0",
                sidebarActive ? "text-muted-foreground/50 hover:text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={sidebarActive ? "Close conversation list" : "Open conversation list"}
            >
              {sidebarActive ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            {/* Centered conversation search */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              {searchOpen ? (
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") { e.preventDefault(); closeSearch(); }
                    }}
                    placeholder="Search conversations…"
                    aria-label="Search conversations"
                    className="w-full h-9 pl-9 pr-9 rounded-xl border border-border/40 bg-background text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
                  />
                  <button
                    onClick={closeSearch}
                    aria-label="Close search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search conversations"
                  title="Search conversations"
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={handleContextToggle}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-all shrink-0",
                contextActive ? "text-muted-foreground/50 hover:text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={contextActive ? "Close context panel" : "Open context panel"}
            >
              {contextActive ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          </div>
        )}

        <main className={cn(
          "flex-1 overflow-hidden relative",
          isFocus && "flex items-center justify-center"
        )}>
          <div className={cn(
            "h-full overflow-y-auto scrollbar-thin",
            mode === "writer" ? "max-w-2xl mx-auto w-full px-4" : mode === "focus" ? "max-w-3xl mx-auto w-full px-4" : ""
          )}>
            {children}
          </div>
        </main>

        {isFocus && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <span className="text-micro text-muted-foreground/60 uppercase tracking-[0.2em] font-semibold px-3 py-1 rounded-full bg-muted/30 border border-border/20 backdrop-blur-sm">
              {mode === "focus" ? "Focus Mode" : "Writer Mode"}
            </span>
          </div>
        )}

        {/* Desktop: context overlay drawer (for chat / standard mode) */}
        <AnimatePresence>
          {contextPanelOpen && mode !== "compact" && !isFocus && !isMobile && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={t({ duration: duration.fast })}
                className="absolute inset-0 z-20 bg-black/10"
                onClick={toggleContextPanel}
              />
              <motion.div
                initial={{ x: CONTEXT_WIDTH }}
                animate={{ x: 0 }}
                exit={{ x: CONTEXT_WIDTH }}
                transition={t({ duration: duration.normal, ease: ease.default })}
                className="absolute top-0 right-0 bottom-0 z-30 w-[320px] max-w-[85vw] shadow-premium"
              >
                <AIContextPanel />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile: context bottom sheet */}
        <AnimatePresence>
          {mobileContextOpen && !isFocus && isMobile && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={t({ duration: duration.fast })}
                className="absolute inset-0 z-40 bg-black/50"
                onClick={() => setMobileContextOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={t({ type: "spring", stiffness: 400, damping: 40 })}
                className="absolute inset-x-0 bottom-0 z-50 h-[70vh] rounded-t-2xl overflow-hidden shadow-premium"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 mt-2.5 h-1 w-10 rounded-full bg-muted-foreground/20" />
                <AIContextPanel />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: context inline panel (for compact mode) */}
      {contextPanelOpen && mode === "compact" && !isMobile && (
        <aside className="hidden md:block w-[320px] shrink-0 border-l border-border/30 h-full">
          <AIContextPanel />
        </aside>
      )}
    </div>
  );
}
