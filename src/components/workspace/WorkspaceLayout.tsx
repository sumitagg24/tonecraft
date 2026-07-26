"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore, type WorkspaceMode } from "@/stores/workspace-store";
import { useChatStore } from "@/stores/chat-store";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/utils";
import { duration, ease, sidebarTransition, fadeInScale } from "@/styles/motion";
import { ConversationSidebar } from "./ConversationSidebar";
import { AIContextPanel } from "./AIContextPanel";
import { UniversalSearch } from "./UniversalSearch";
import { PanelRightOpen, PanelRightClose, PanelLeftOpen, PanelLeftClose, Command, Search } from "lucide-react";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const {
    mode, sidebarOpen, contextPanelOpen, setSidebarOpen, setContextPanelOpen,
    toggleSidebar, toggleContextPanel, setMode,
  } = useWorkspaceStore();
  const { toggle } = useCommandPalette();
  const [showSearch, setShowSearch] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcuts([
    { key: "k", meta: true, handler: () => toggle() },
    { key: "b", meta: true, handler: () => toggleSidebar() },
    { key: "f", meta: true, shift: true, handler: () => setShowSearch((p) => !p) },
    { key: "Escape", handler: () => { setShowSearch(false); } },
  ]);

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

  const sidebarWidth = sidebarOpen ? 280 : 0;
  const contextWidth = contextPanelOpen ? 320 : 48;

  const isMinimal = mode === "minimal";
  const isFocus = mode === "focus" || mode === "writer";

  return (
    <div ref={containerRef} className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <motion.div
        animate={{ width: sidebarWidth }}
        transition={{ duration: duration.normal, ease: ease.default }}
        className="shrink-0 overflow-hidden"
      >
        {sidebarOpen && <ConversationSidebar />}
      </motion.div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mode-specific top bar */}
        {!isFocus && (
          <div className="shrink-0 h-11 flex items-center justify-between px-4 border-b border-border/20 bg-background/40 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-all",
                  sidebarOpen ? "text-muted-foreground/50 hover:text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowSearch((p) => !p)}
                className="flex items-center gap-2 h-7 px-2.5 rounded-lg text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline-flex items-center rounded border border-border/30 bg-muted/30 px-1 py-0 text-[9px] font-mono">⌘⇧F</kbd>
              </button>
            </div>

            <div className="flex items-center gap-1">
              {/* Mode switcher */}
              <ModeSwitcher current={mode} onChange={handleModeChange} />
              <div className="w-px h-4 bg-border/20 mx-1" />
              <button
                onClick={toggle}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/20 transition-all"
                aria-label="Command palette"
              >
                <Command className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggleContextPanel}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-all",
                  contextPanelOpen ? "text-muted-foreground/50 hover:text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={contextPanelOpen ? "Close context panel" : "Open context panel"}
              >
                {contextPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Search overlay */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-start justify-center pt-12 bg-background/60 backdrop-blur-sm"
            >
              <UniversalSearch onClose={() => setShowSearch(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content area */}
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

        {/* Mode indicator */}
        {isFocus && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <span className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em] font-medium">
              {mode === "focus" ? "Focus Mode" : "Writer Mode"}
            </span>
          </div>
        )}
      </div>

      {/* Right Context Panel */}
      <motion.div
        animate={{ width: contextWidth }}
        transition={{ duration: duration.normal, ease: ease.default }}
        className="shrink-0 overflow-hidden"
      >
        <AIContextPanel />
      </motion.div>
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
