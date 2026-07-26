"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { searchCapabilities, getAllCapabilities } from "@/stores/capability-registry";
import { cn } from "@/lib/utils";
import { MotionStagger, spring, duration, ease, fadeInScale, comboboxTransition } from "@/styles/motion";
import {
  Search, X, MessageSquare, Star, Pin, Sparkles, Wand2,
  Settings, ArrowRight, Command, Hash, Clock, Bookmark,
  History, Trash2, FileText, Globe, CheckSquare, Zap,
  Smile, Heart, Briefcase, Gem, Laugh, Terminal,
  RefreshCw, MessageCircle, Mail, Camera, Headphones,
} from "lucide-react";
import { TwitterIcon, LinkedinIcon } from "@/components/icons/social-icons";

type SearchCategory = "chats" | "messages" | "templates" | "capabilities" | "actions";

interface SearchResult {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  category: SearchCategory;
  href?: string;
  action?: () => void;
  color?: string;
  date?: Date;
}

export function UniversalSearch({ onClose }: { onClose?: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<SearchCategory | "all">("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { chats, searchQuery, setSearchQuery, searchResults, setSearchResults } = useChatStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  const results = useMemo(() => {
    const items: SearchResult[] = [];

    if (!query) {
      items.push(
        { id: "new-chat", label: "New Chat", description: "Start a fresh conversation", icon: MessageSquare, category: "actions", action: () => { router.push("/chat"); onClose?.(); } },
        { id: "focus-mode", label: "Focus Mode", description: "Minimal distraction layout", icon: Sparkles, category: "actions", action: () => { document.querySelector("[data-mode='focus']")?.dispatchEvent(new Event("click")); onClose?.(); } },
        { id: "writer-mode", label: "Writer Mode", description: "Full-screen writing layout", icon: FileText, category: "actions", action: () => { onClose?.(); } },
      );
    }

    if (query) {
      const q = query.toLowerCase();

      const matchedChats = chats
        .filter((c) => !c.isArchived && c.title.toLowerCase().includes(q))
        .slice(0, 5)
        .map((c) => ({
          id: `chat-${c.id}`, label: c.title,
          description: `${c.tone || "chat"} · ${c._count?.messages || 0} messages`,
          icon: c.isPinned ? Pin : c.isFavorite ? Star : MessageSquare,
          category: "chats" as const,
          href: `/chat/${c.id}`,
          color: c.isPinned ? "#eab308" : c.isFavorite ? "#f59e0b" : undefined,
          date: c.updatedAt,
        }));

      const matchedCapabilities = searchCapabilities(q).slice(0, 8).map((cap) => ({
        id: `cap-${cap.id}`, label: cap.label, description: cap.description,
        icon: getCapIcon(cap.icon), category: "capabilities" as const,
        action: () => { useChatStore.getState().setSelectedTone(cap.defaultTone || "professional"); onClose?.(); },
      }));

      items.push(...matchedChats, ...matchedCapabilities);
    }

    return items;
  }, [query, chats, router, onClose]);

  const filteredResults = useMemo(() => {
    if (activeCategory === "all") return results;
    return results.filter((r) => r.category === activeCategory);
  }, [results, activeCategory]);

  const categories: { id: SearchCategory | "all"; label: string; icon: React.ElementType }[] = [
    { id: "all", label: "All", icon: Search },
    { id: "chats", label: "Chats", icon: MessageSquare },
    { id: "capabilities", label: "Capabilities", icon: Wand2 },
    { id: "actions", label: "Actions", icon: Zap },
  ];

  const selectItem = (item: SearchResult) => {
    if (item.action) { item.action(); return; }
    if (item.href) { router.push(item.href); onClose?.(); }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filteredResults.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && filteredResults[selectedIndex]) { selectItem(filteredResults[selectedIndex]); }
    if (e.key === "Escape") { onClose?.(); }
  };

  return (
    <motion.div
      variants={fadeInScale}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={comboboxTransition}
      className="w-full max-w-xl glass-panel rounded-2xl border-border/50 shadow-2xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
        <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search chats, capabilities, templates..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
          aria-label="Search"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-muted-foreground/50 hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border/30 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70">
          ESC
        </kbd>
      </div>

      <div className="flex gap-1 px-3 py-2 border-b border-border/20 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap",
              activeCategory === cat.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/30"
            )}
          >
            <cat.icon className="w-3 h-3" />
            {cat.label}
          </button>
        ))}
      </div>

      {filteredResults.length > 0 ? (
        <div className="max-h-80 overflow-y-auto p-2 space-y-0.5 scrollbar-thin" role="listbox">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${query}-${activeCategory}`}
              variants={MotionStagger.Fast.container}
              initial="initial"
              animate="animate"
            >
              {filteredResults.map((item, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <motion.button
                    key={item.id}
                    variants={MotionStagger.Fast.children}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                      isSelected
                        ? "bg-muted/60 border border-border/30"
                        : "hover:bg-muted/20 border border-transparent"
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", item.color || "text-muted-foreground")} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{item.label}</p>
                      {item.description && (
                        <p className="text-[11px] text-muted-foreground/60 truncate">{item.description}</p>
                      )}
                    </div>
                    <ArrowRight className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-opacity",
                      isSelected ? "opacity-100 text-muted-foreground" : "opacity-0"
                    )} />
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center py-12 text-center px-4">
          <Search className="h-8 w-8 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground/60">
            {query ? `No results for "${query}"` : "Start typing to search"}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function getCapIcon(icon: string): React.ElementType {
  const map: Record<string, React.ElementType> = {
    RefreshCw, Briefcase, MessageCircle, Zap, Smile, Heart,
    Gem, Laugh, CheckSquare, Globe, FileText, Mail,
    LinkedinIcon, TwitterIcon, Camera, Terminal, Headphones,
  };
  return map[icon] || Sparkles;
}
