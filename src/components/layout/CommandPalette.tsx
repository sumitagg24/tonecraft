"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageSquare, Settings, Wand2, Star, Pin, ArrowRight,
  FileText, Sparkles, Zap, Hash, Plus,
  RefreshCw, Briefcase, MessageCircle, Smile, Heart, Gem, Laugh,
  CheckSquare, Globe, Mail, Camera, Terminal, Headphones,
} from "lucide-react";
import { TwitterIcon, LinkedinIcon } from "@/components/icons/social-icons";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { getAllCapabilities } from "@/stores/capability-registry";
import { fadeIn, fadeInScale, comboboxTransition } from "@/styles/motion";
import { useChat } from "@/hooks/use-chat";

type ResultCategory = "chat" | "capability" | "page" | "action" | "mode";

interface Result {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  category: ResultCategory;
  color?: string;
}

export function CommandPalette() {
  const { isOpen, setOpen } = useCommandPalette();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const chats = useChatStore((s) => s.chats);
  const setMode = useWorkspaceStore((s) => s.setMode);
  const { createChat } = useChat();

  const allResults: Result[] = [
    { id: "new-chat", label: "New Chat", description: "Start a fresh conversation", icon: Plus, action: async () => { const chat = await createChat(); router.push(`/chat/${chat.id}`); setOpen(false); }, category: "action" },
    { id: "tools", label: "AI Tools", description: "Explore all writing capabilities", icon: Wand2, href: "/tools", category: "page" },
    { id: "settings", label: "Settings", description: "Manage preferences and account", icon: Settings, href: "/settings", category: "page" },
    { id: "search-page", label: "Search", description: "Search across chats and messages", icon: Search, href: "/search", category: "page" },

    { id: "mode-chat", label: "Chat Mode", description: "Full workspace layout", icon: MessageSquare, action: () => { setMode("chat"); setOpen(false); }, category: "mode" },
    { id: "mode-focus", label: "Focus Mode", description: "Minimal distraction layout", icon: EyeIcon, action: () => { setMode("focus"); setOpen(false); }, category: "mode" },
    { id: "mode-writer", label: "Writer Mode", description: "Full-screen writing layout", icon: FileText, action: () => { setMode("writer"); setOpen(false); }, category: "mode" },
    { id: "mode-compact", label: "Compact Mode", description: "Space-efficient layout", icon: Hash, action: () => { setMode("compact"); setOpen(false); }, category: "mode" },
    { id: "mode-minimal", label: "Minimal Mode", description: "Slim UI layout", icon: MinimizeIcon, action: () => { setMode("minimal"); setOpen(false); }, category: "mode" },

    ...getAllCapabilities().slice(0, 20).map((cap) => ({
      id: `cap-${cap.id}`, label: cap.label, description: cap.description,
      icon: getCapIcon(cap.icon), category: "capability" as const,
      color: getCapColor(cap.category),
      action: () => {
        useChatStore.getState().setSelectedTone(cap.defaultTone || "professional");
        setOpen(false);
      },
    })),

    ...chats.filter(c => !c.isArchived).slice(0, 8).map(c => ({
      id: c.id, label: c.title,
      description: `${c.tone || "chat"} · ${c._count?.messages || 0} messages`,
      icon: c.isPinned ? Pin : c.isFavorite ? Star : MessageSquare,
      href: `/chat/${c.id}`, category: "chat" as ResultCategory,
      color: c.isPinned ? "#eab308" : c.isFavorite ? "#f59e0b" : undefined,
    })),
  ];

  const results = query
    ? allResults.filter(r =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        r.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allResults;

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const selectItem = useCallback((item: Result) => {
    if (item.action) { item.action(); return; }
    if (item.href) { router.push(item.href); setOpen(false); }
  }, [router, setOpen]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIndex]) { selectItem(results[selectedIndex]); }
  };

  const groupedResults = useCallback(() => {
    const groups: { category: ResultCategory; label: string; items: Result[] }[] = [];
    const categoryOrder: ResultCategory[] = ["action", "mode", "chat", "capability", "page"];
    const categoryLabels: Record<ResultCategory, string> = {
      action: "Actions", mode: "Workspace Modes", chat: "Recent Chats",
      capability: "Capabilities", page: "Pages",
    };
    for (const cat of categoryOrder) {
      const items = results.filter(r => r.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, label: categoryLabels[cat], items });
      }
    }
    return groups;
  }, [results]);

  const grouped = groupedResults();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={fadeIn} initial="initial" animate="animate" exit="exit"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            variants={fadeInScale}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={comboboxTransition}
            className="fixed top-[12%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
          >
            <div className="glass-panel rounded-2xl border-border/50 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
                <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search chats, capabilities, modes..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                  aria-label="Command palette search"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border/30 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70">
                  ESC
                </kbd>
              </div>

              {grouped.length > 0 ? (
                <div className="max-h-80 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                  {grouped.map((group) => (
                    <div key={group.category}>
                      <div className="flex items-center gap-2 px-3 py-1">
                        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                          {group.label}
                        </span>
                        <div className="flex-1 h-px bg-border/20" />
                      </div>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const globalIndex = results.indexOf(item);
                          const isSelected = globalIndex === selectedIndex;
                          return (
                            <button
                              key={item.id}
                              onClick={() => selectItem(item)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                                isSelected
                                  ? "bg-muted/60 border border-border/30"
                                  : "hover:bg-muted/20 border border-transparent"
                              )}
                            >
                              <item.icon className={cn("h-4 w-4 shrink-0", item.color || "text-muted-foreground")} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.label}</p>
                                {item.description && (
                                  <p className="text-[11px] text-muted-foreground/60 truncate">{item.description}</p>
                                )}
                              </div>
                              <ArrowRight className={cn(
                                "h-3.5 w-3.5 shrink-0 transition-opacity",
                                isSelected ? "opacity-100 text-muted-foreground" : "opacity-0"
                              )} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 text-center px-4">
                  <Search className="h-8 w-8 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground/60">No results for &quot;{query}&quot;</p>
                </div>
              )}

              <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border/20 bg-muted/10">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
                  <span><kbd className="px-1 py-0.5 rounded border border-border/20 bg-muted/30">↑↓</kbd> Navigate</span>
                  <span><kbd className="px-1 py-0.5 rounded border border-border/20 bg-muted/30">↵</kbd> Select</span>
                  <span><kbd className="px-1 py-0.5 rounded border border-border/20 bg-muted/30">Esc</kbd> Close</span>
                </div>
                <div className="flex-1" />
                <span className="text-[10px] text-muted-foreground/30">{results.length} results</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
}

function MinimizeIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>;
}

function getCapIcon(icon: string): React.ElementType {
  const map: Record<string, React.ElementType> = {
    RefreshCw, Briefcase, MessageCircle, Zap, Smile, Heart, Gem, Laugh,
    CheckSquare, Globe, FileText, Mail, LinkedinIcon, TwitterIcon, Camera,
    Terminal, Headphones,
  };
  return map[icon] || Sparkles;
}

function getCapColor(category: string): string {
  const colors: Record<string, string> = {
    writing: "#a855f7", business: "#6366f1", social: "#10b981",
    email: "#3b82f6", marketing: "#f97316", education: "#14b8a6",
    "customer-support": "#6366f1", programming: "#a855f7",
    translation: "#14b8a6", grammar: "#f97316", utilities: "#8b5cf6",
    reply: "#10b981",
  };
  return colors[category] || "#888";
}
