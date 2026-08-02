"use client";
import { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useWorkspaceStore, type WorkspaceMode } from "@/stores/workspace-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/styles/motion";
import { ConversationSidebar } from "./ConversationSidebar";
import { AIContextPanel } from "./AIContextPanel";
import { PanelRightOpen, PanelRightClose, PanelLeftOpen, PanelLeftClose } from "lucide-react";

interface ComposeWorkspaceProps {
  children: React.ReactNode;
}

const SIDEBAR_WIDTH = 280;
const CONTEXT_WIDTH = 320;

export function ComposeWorkspace({ children }: ComposeWorkspaceProps) {
  const pathname = usePathname();
  const {
    mode, sidebarOpen, contextPanelOpen, mobileSidebarOpen, mobileContextOpen,
    toggleSidebar, toggleContextPanel, setMode,
    setSidebarOpen, setContextPanelOpen,
    setMobileSidebarOpen, setMobileContextOpen,
  } = useWorkspaceStore();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reduced = useReducedMotion();

  // `reduced ? { duration: 0 } : transition`
  const t = (transition: { duration: number; ease?: unknown } | object) =>
    reduced ? { duration: 0 } : transition;

  useKeyboardShortcuts([
    { key: "b", meta: true, handler: () => (isMobile ? setMobileSidebarOpen(!mobileSidebarOpen) : toggleSidebar()) },
    { key: "\\", meta: true, handler: () => (isMobile ? setMobileContextOpen(!mobileContextOpen) : toggleContextPanel()) },
    { key: "Escape", handler: () => { setMobileSidebarOpen(false); setMobileContextOpen(false); } },
  ]);

  // Close mobile overlays on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
    setMobileContextOpen(false);
  }, [pathname, setMobileSidebarOpen, setMobileContextOpen]);

  const handleModeChange = useCallback((newMode: WorkspaceMode) => {
    setMode(newMode);
    if (newMode === "focus" || newMode === "writer") {
      setSidebarOpen(false);
      setContextPanelOpen(false);
    } else if (newMode === "compact") {
      setSidebarOpen(false);
      setContextPanelOpen(true);
    } else {
      setSidebarOpen(true);
      setContextPanelOpen(true);
    }
  }, [setMode, setSidebarOpen, setContextPanelOpen]);

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
        {sidebarOpen && <ConversationSidebar />}
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
                "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                sidebarActive ? "text-muted-foreground/50 hover:text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={sidebarActive ? "Close conversation list" : "Open conversation list"}
            >
              {sidebarActive ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-1">
              <div className="hidden sm:flex">
                <ModeSwitcher current={mode} onChange={handleModeChange} />
              </div>
              <div className="hidden sm:block w-px h-4 bg-border/20 mx-1" />
              <button
                onClick={handleContextToggle}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  contextActive ? "text-muted-foreground/50 hover:text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={contextActive ? "Close context panel" : "Open context panel"}
              >
                {contextActive ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <main className={cn(
          "flex-1 overflow-hidden relative",
          isFocus && "flex items-center justify-center"
        )}>
          <div className={cn(
            "h-full overflow-y-auto scrollbar-thin",
            isFocus ? "max-w-3xl w-full px-4" : ""
          )}>
            {children}
          </div>
        </main>

        {isFocus && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <span className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em] font-medium">
              {mode === "focus" ? "Focus Mode" : "Writer Mode"}
            </span>
          </div>
        )}

        {/* Desktop: context overlay drawer */}
        <AnimatePresence>
          {contextPanelOpen && !isFocus && !isMobile && (
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
    </div>
  );
}

const modes: { id: WorkspaceMode; label: string; icon: string }[] = [
  { id: "chat", label: "Chat", icon: "M" },
  { id: "focus", label: "Focus", icon: "F" },
  { id: "writer", label: "Writer", icon: "W" },
  { id: "compact", label: "Compact", icon: "C" },
  { id: "minimal", label: "Minimal", icon: "S" },
];

function ModeSwitcher({ current, onChange }: { current: WorkspaceMode; onChange: (mode: WorkspaceMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/20 border border-border/20">
      {modes.map((m) => (
        <button
          key={m.id}
          data-mode={m.id}
          onClick={() => onChange(m.id)}
          className={cn(
            "h-6 px-2 rounded-md text-[9px] font-medium transition-all uppercase tracking-wider",
            current === m.id
              ? "bg-background text-foreground shadow-sm border border-border/20"
              : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/20"
          )}
          title={m.label}
        >
          {m.icon}
        </button>
      ))}
    </div>
  );
}
