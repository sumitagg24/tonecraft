"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { MotionStagger } from "@/styles/motion";
import {
  Search, X, Sparkles, Star, Plus, MessageSquare, Clock,
  Bookmark, Hash, List as ListIcon,
  Briefcase, MessageCircle, Heart, Smile, Zap, Gem,
  Mail, Camera, Globe, Terminal,
  Headphones, FileText, CheckSquare,
  Wand2, LayoutGrid,
} from "lucide-react";
import { TwitterIcon, LinkedinIcon } from "@/components/icons/social-icons";

interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: PromptCategory;
  tone: string;
  platform?: string;
  color: string;
  prompt: string;
  isPro?: boolean;
}

type PromptCategory =
  | "writing" | "business" | "social" | "career" | "email"
  | "marketing" | "education" | "support" | "programming"
  | "translation" | "grammar" | "utilities";

const categories: { id: PromptCategory; label: string; icon: React.ElementType }[] = [
  { id: "writing", label: "Writing", icon: Wand2 },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "social", label: "Social", icon: MessageCircle },
  { id: "email", label: "Email", icon: Mail },
  { id: "marketing", label: "Marketing", icon: MegaphoneIcon },
  { id: "education", label: "Education", icon: BookIcon },
  { id: "support", label: "Support", icon: Headphones },
  { id: "programming", label: "Dev", icon: Terminal },
  { id: "translation", label: "Translate", icon: Globe },
  { id: "grammar", label: "Grammar", icon: CheckSquare },
  { id: "career", label: "Career", icon: Briefcase },
  { id: "utilities", label: "Utilities", icon: Zap },
];

const allTemplates: PromptTemplate[] = [
  { id: "p1", title: "Professional Email", description: "Craft a polished professional email", icon: "Mail", category: "email", tone: "professional", platform: "email", color: "#3b82f6", prompt: "Write a professional email about:" },
  { id: "p2", title: "Friendly Message", description: "Write a warm friendly message", icon: "MessageCircle", category: "writing", tone: "friendly", color: "#10b981", prompt: "Write a friendly message about:" },
  { id: "p3", title: "LinkedIn Post", description: "Create an engaging LinkedIn post", icon: "Linkedin", category: "social", tone: "professional", platform: "linkedin", color: "#0A66C2", prompt: "Write a LinkedIn post about:" },
  { id: "p4", title: "Twitter Thread", description: "Write an engaging Twitter thread", icon: "Twitter", category: "social", tone: "casual", platform: "twitter", color: "#1DA1F2", prompt: "Write a Twitter thread about:" },
  { id: "p5", title: "Instagram Caption", description: "Create an Instagram caption", icon: "Camera", category: "social", tone: "friendly", platform: "instagram", color: "#E4405F", prompt: "Write an Instagram caption for:" },
  { id: "p6", title: "Grammar Fix", description: "Fix grammar and spelling errors", icon: "CheckSquare", category: "grammar", tone: "professional", color: "#f97316", prompt: "Fix the grammar in this text:" },
  { id: "p7", title: "Summarize Text", description: "Condense text into key points", icon: "FileText", category: "writing", tone: "professional", color: "#a855f7", prompt: "Summarize this text concisely:" },
  { id: "p8", title: "Translate", description: "Translate between languages", icon: "Globe", category: "translation", tone: "professional", color: "#14b8a6", prompt: "Translate this text:" },
  { id: "p9", title: "Customer Support", description: "Write a support response", icon: "Headphones", category: "support", tone: "friendly", color: "#6366f1", prompt: "Write a customer support response about:" },
  { id: "p10", title: "Funny Reply", description: "Generate a witty funny reply", icon: "Smile", category: "writing", tone: "funny", color: "#f43f5e", prompt: "Write a funny reply to: " },
  { id: "p11", title: "Romantic Message", description: "Write a heartfelt romantic message", icon: "Heart", category: "writing", tone: "romantic", color: "#f43f5e", prompt: "Write a romantic message about:" },
  { id: "p12", title: "Corporate Update", description: "Draft a corporate announcement", icon: "Briefcase", category: "business", tone: "corporate", color: "#6366f1", prompt: "Write a corporate update about:" },
  { id: "p13", title: "Casual Chat", description: "Write a casual conversation message", icon: "MessageCircle", category: "writing", tone: "casual", color: "#10b981", prompt: "Write a casual message about:" },
  { id: "p14", title: "Luxury Brand", description: "Write a premium luxury message", icon: "Gem", category: "marketing", tone: "luxury", color: "#d4a853", prompt: "Write a luxury brand message about:" },
  { id: "p15", title: "Academic Writing", description: "Write academic or research text", icon: "BookIcon", category: "education", tone: "academic", color: "#14b8a6", prompt: "Write an academic text about:" },
  { id: "p16", title: "WhatsApp Message", description: "Write a WhatsApp message", icon: "MessageCircle", category: "social", tone: "friendly", platform: "whatsapp", color: "#25D366", prompt: "Write a WhatsApp message about:" },
  { id: "p17", title: "Slack Update", description: "Write a Slack channel update", icon: "Hash", category: "business", tone: "friendly", platform: "slack", color: "#4A154B", prompt: "Write a Slack message about:" },
  { id: "p18", title: "Discord Announcement", description: "Write a Discord announcement", icon: "MessageSquare", category: "social", tone: "friendly", platform: "discord", color: "#5865F2", prompt: "Write a Discord announcement about:" },
  { id: "p19", title: "CEO Statement", description: "Draft a CEO-level statement", icon: "Briefcase", category: "business", tone: "ceo", color: "#6366f1", prompt: "Write a CEO statement about:", isPro: true },
  { id: "p20", title: "Marketing Email", description: "Write a promotional email", icon: "Mail", category: "marketing", tone: "professional", platform: "email", color: "#3b82f6", prompt: "Write a marketing email about:" },
  { id: "p21", title: "Code Documentation", description: "Write code documentation", icon: "Terminal", category: "programming", tone: "professional", color: "#a855f7", prompt: "Write code documentation for:" },
  { id: "p22", title: "API Docs", description: "Write API documentation", icon: "Terminal", category: "programming", tone: "professional", color: "#a855f7", prompt: "Write API documentation for:" },
  { id: "p23", title: "Expand Text", description: "Expand text with more detail", icon: "FileText", category: "writing", tone: "professional", color: "#8b5cf6", prompt: "Expand this text with more detail:" },
  { id: "p24", title: "Shorten Text", description: "Make text more concise", icon: "Zap", category: "writing", tone: "professional", color: "#8b5cf6", prompt: "Shorten this text:" },
];

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

const iconMap: Record<string, React.ElementType> = {
  Mail, MessageCircle, LinkedinIcon, TwitterIcon, Camera, CheckSquare, FileText,
  Globe, Headphones, Smile, Heart, Briefcase, Gem, Terminal, MessageSquare,
  Hash, Zap, Star, Plus, Search, X, Sparkles, Clock, Wand2,
};

export function PromptLibrary({ onClose }: { onClose?: () => void }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "all">("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();
  const { createChat } = useChat();

  const filtered = useMemo(() => {
    let list = allTemplates;
    if (selectedCategory !== "all") {
      list = list.filter((t) => t.category === selectedCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.includes(q)
      );
    }
    return list;
  }, [search, selectedCategory]);

  const handleSelect = async (template: PromptTemplate) => {
    const chat = await createChat({ title: template.title, tone: template.tone });
    useChatStore.getState().setSelectedTone(template.tone);
    if (template.platform) {
      useChatStore.getState().setContext({ platform: template.platform });
    }
    router.push(`/chat/${chat.id}`);
    onClose?.();
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary" />
            Prompt Library
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
              aria-label={viewMode === "grid" ? "List view" : "Grid view"}
            >
              {viewMode === "grid" ? <ListIcon className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full h-9 bg-muted/30 border border-border/30 rounded-xl pl-9 pr-3 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            aria-label="Search prompts"
          />
        </div>
      </div>

      <div className="shrink-0 px-3 py-2 border-b border-border/20 overflow-x-auto scrollbar-none">
        <div className="flex gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? "all" : cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all border",
                selectedCategory === cat.id
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border/20 text-muted-foreground/70 hover:border-border/40 hover:text-foreground"
              )}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Search className="w-8 h-8 text-muted-foreground/20 mb-3" />
              <p className="text-xs text-muted-foreground/60">No prompts match your search</p>
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div
              key="grid"
              variants={MotionStagger.Grid.container}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 gap-2"
            >
              {filtered.map((template) => (
                <motion.div
                  key={template.id}
                  variants={MotionStagger.Grid.children}
                  layout
                >
                  <PromptCard
                    template={template}
                    isFavorite={favorites.has(template.id)}
                    onSelect={() => handleSelect(template)}
                    onToggleFavorite={() => toggleFavorite(template.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={MotionStagger.Normal.container}
              initial="initial"
              animate="animate"
              className="space-y-1"
            >
              {filtered.map((template) => (
                <motion.div
                  key={template.id}
                  variants={MotionStagger.Normal.children}
                  layout
                >
                  <PromptListItem
                    template={template}
                    isFavorite={favorites.has(template.id)}
                    onSelect={() => handleSelect(template)}
                    onToggleFavorite={() => toggleFavorite(template.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PromptCard({
  template, isFavorite, onSelect, onToggleFavorite,
}: {
  template: PromptTemplate; isFavorite: boolean; onSelect: () => void; onToggleFavorite: () => void;
}) {
  const Icon = iconMap[template.icon] || Sparkles;
  return (
    <div
      onClick={onSelect}
      className="group relative p-3.5 rounded-xl border border-border/20 bg-background/30 backdrop-blur-sm cursor-pointer hover:border-border/40 hover:bg-muted/20 transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${template.color}15` }}>
          <Icon className="w-4 h-4" style={{ color: template.color }} />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={cn("w-3.5 h-3.5", isFavorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground/50")} />
        </button>
      </div>
      <h3 className="text-xs font-semibold mb-1">{template.title}</h3>
      <p className="text-[10px] text-muted-foreground/60 leading-relaxed line-clamp-2">{template.description}</p>
      <div className="flex items-center gap-1.5 mt-2.5">
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground/60 capitalize">{template.tone}</span>
        {template.isPro && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-500 font-medium">PRO</span>
        )}
      </div>
    </div>
  );
}

function PromptListItem({
  template, isFavorite, onSelect, onToggleFavorite,
}: {
  template: PromptTemplate; isFavorite: boolean; onSelect: () => void; onToggleFavorite: () => void;
}) {
  const Icon = iconMap[template.icon] || Sparkles;
  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/20 transition-all border border-transparent hover:border-border/20"
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${template.color}15` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: template.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{template.title}</p>
        <p className="text-[10px] text-muted-foreground/60 truncate">{template.description}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star className={cn("w-3 h-3", isFavorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30")} />
      </button>
    </div>
  );
}
