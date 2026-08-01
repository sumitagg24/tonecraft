"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/stores/chat-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { cn } from "@/lib/utils";
import { TONES } from "@/lib/constants";
import { ease } from "@/styles/motion";
import {
  ChevronDown, Sparkles, MessageSquare, Clock, Hash,
  Bookmark, Star, Zap, Globe, Palette,
  FileText, Brain, BarChart3,
  PanelRightClose, PanelRightOpen, Copy,
  RefreshCw, Heart, User, Target, Activity,
} from "lucide-react";

type Section = "summary" | "memory" | "stats" | "presets" | "actions";

export function AIContextPanel() {
  const { currentChat, messages, selectedTone, selectedModel } = useChatStore();
  const { contextPanelOpen, toggleContextPanel, setContextPanelOpen } = useWorkspaceStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string>("summary");

  if (!contextPanelOpen) {
    return (
      <div className="h-full border-l border-border/20 bg-sidebar/20 backdrop-blur-sm flex flex-col items-center py-4 px-2">
        <button
          onClick={toggleContextPanel}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          aria-label="Open context panel"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
        <div className="flex flex-col gap-2 mt-4">
          {sections.slice(0, 5).map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setContextPanelOpen(true); }}
              className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                activeSection === s.id ? "text-primary bg-primary/10" : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/20"
              )}
              title={s.label}
            >
              <s.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const toggleSection = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const wordCount = messages.reduce((acc, m) => acc + m.content.split(/\s+/).filter(Boolean).length, 0);
  const charCount = messages.reduce((acc, m) => acc + m.content.length, 0);
  const estTokens = Math.round(charCount / 4);

  return (
    <aside className="h-full bg-sidebar/30 backdrop-blur-2xl border-l border-border/20 flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">AI Context</span>
        </div>
        <button
          onClick={toggleContextPanel}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          aria-label="Close context panel"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-2.5">
        <Section
          id="summary"
          label="Summary"
          icon={MessageSquare}
          collapsed={collapsed}
          onToggle={toggleSection}
        >
          <SummarySection currentChat={currentChat} selectedTone={selectedTone} selectedModel={selectedModel} />
        </Section>

        <Section
          id="memory"
          label="Conversation Memory"
          icon={Brain}
          collapsed={collapsed}
          onToggle={toggleSection}
        >
          <MemorySection />
        </Section>

        <Section
          id="stats"
          label="Statistics"
          icon={BarChart3}
          collapsed={collapsed}
          onToggle={toggleSection}
        >
          <StatsSection messages={messages} wordCount={wordCount} charCount={charCount} estTokens={estTokens} />
        </Section>

        <Section
          id="presets"
          label="Favorite Presets"
          icon={Bookmark}
          collapsed={collapsed}
          onToggle={toggleSection}
        >
          <PresetsSection />
        </Section>

        <Section
          id="actions"
          label="Recent Actions"
          icon={Activity}
          collapsed={collapsed}
          onToggle={toggleSection}
        >
          <ActionsSection />
        </Section>
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-border/20">
        <UsageBadge wordCount={wordCount} estTokens={estTokens} />
      </div>
    </aside>
  );
}

function Section({
  id, label, icon: Icon, collapsed, onToggle, children,
}: {
  id: string; label: string; icon: React.ElementType;
  collapsed: Record<string, boolean>; onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  const isCollapsed = collapsed[id];
  return (
    <div className="rounded-xl border border-border/20 bg-background/30 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-medium transition-colors hover:bg-muted/20"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span>{label}</span>
        </div>
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: ease.default }}
          >
            <div className="px-3.5 pb-3 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SummarySection({ currentChat, selectedTone, selectedModel }: any) {
  const tone = TONES.find((t) => t.id === selectedTone);
  return (
    <div className="space-y-2.5">
      <InfoRow icon={MessageSquare} label="Title" value={currentChat?.title || "Untitled"} />
      <InfoRow icon={Palette} label="Tone" value={tone?.label || selectedTone} color={tone?.color} />
      <InfoRow icon={Globe} label="Provider" value={selectedModel || "Auto"} />
      <InfoRow icon={Hash} label="Messages" value={currentChat?._count?.messages ?? 0} />
      <InfoRow icon={Clock} label="Created" value={currentChat?.createdAt ? new Date(currentChat.createdAt).toLocaleDateString() : "—"} />
    </div>
  );
}

function MemorySection() {
  const items = [
    { icon: User, label: "User Context", value: "Professional communication" },
    { icon: Target, label: "Goal", value: "Clear effective messaging" },
    { icon: Heart, label: "Style", value: "Balanced & polished" },
  ];
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <InfoRow key={item.label} icon={item.icon} label={item.label} value={item.value} />
      ))}
      <button className="w-full mt-2 text-[10px] text-primary/70 hover:text-primary py-1.5 rounded-lg border border-dashed border-border/30 hover:border-primary/30 transition-all">
        + Add context
      </button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatsSection({ messages, wordCount, charCount, estTokens }: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMsgs = messages.filter((m: any) => m.role === "user").length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aiMsgs = messages.filter((m: any) => m.role === "assistant").length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));
  return (
    <div className="space-y-2">
      <InfoRow icon={MessageSquare} label="User messages" value={userMsgs} />
      <InfoRow icon={BotIcon} label="AI responses" value={aiMsgs} />
      <InfoRow icon={FileText} label="Word count" value={wordCount.toLocaleString()} />
      <InfoRow icon={Hash} label="Characters" value={charCount.toLocaleString()} />
      <InfoRow icon={Zap} label="Est. tokens" value={estTokens.toLocaleString()} />
      <InfoRow icon={Clock} label="Reading time" value={`${readingTime} min`} />
    </div>
  );
}

function BotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}

function PresetsSection() {
  const presets = [
    { label: "Professional Email", tone: "professional", platform: "email" },
    { label: "Casual WhatsApp", tone: "friendly", platform: "whatsapp" },
    { label: "LinkedIn Post", tone: "professional", platform: "linkedin" },
    { label: "Funny Reply", tone: "funny", platform: "discord" },
  ];
  return (
    <div className="space-y-1.5">
      {presets.map((p) => (
        <button
          key={p.label}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs hover:bg-muted/30 transition-all text-left"
        >
          <Star className="w-3 h-3 text-amber-500/60 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{p.label}</p>
            <p className="text-[10px] text-muted-foreground/60">{p.tone} · {p.platform}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function ActionsSection() {
  const actions = [
    { icon: RefreshCw, label: "Regenerated response", time: "2m ago" },
    { icon: Copy, label: "Copied to clipboard", time: "5m ago" },
    { icon: Star, label: "Saved as favorite", time: "10m ago" },
  ];
  return (
    <div className="space-y-1.5">
      {actions.map((a) => (
        <div key={a.label} className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs">
          <a.icon className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <span className="flex-1 truncate text-muted-foreground/80">{a.label}</span>
          <span className="text-[10px] text-muted-foreground/40 shrink-0">{a.time}</span>
        </div>
      ))}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <Icon className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
      <span className="text-muted-foreground/70 min-w-[80px]">{label}</span>
      <span className="font-medium truncate" style={color ? { color } : {}}>{value}</span>
    </div>
  );
}

function UsageBadge({ wordCount, estTokens }: { wordCount: number; estTokens: number }) {
  const pct = Math.min(100, Math.round((estTokens / 16000) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
        <span>Context usage</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: ease.out }}
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
        />
      </div>
      <p className="text-[10px] text-muted-foreground/40">{wordCount} words · ~{estTokens.toLocaleString()} tokens</p>
    </div>
  );
}

const sections = [
  { id: "summary", label: "Summary", icon: MessageSquare },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "presets", label: "Presets", icon: Bookmark },
  { id: "actions", label: "Actions", icon: Activity },
];
