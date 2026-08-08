"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/stores/chat-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { TONES, PLATFORMS } from "@/lib/constants";
import { ease } from "@/styles/motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { api } from "@/lib/api-client";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Persona } from "@/types";
import {
  ChevronDown, Wand2, MessageSquare, Clock, Hash,
  Zap, Globe, Palette, FileText, Brain, BarChart3,
  PanelRightClose, User, Target, Sliders, Paperclip, Languages, Smile, Check,
} from "lucide-react";

export function AIContextPanel() {
  const currentChat = useChatStore((s) => s.currentChat);
  const messages = useChatStore((s) => s.messages);
  const selectedTone = useChatStore((s) => s.selectedTone);
  const context = useChatStore((s) => s.context);
  const { setContextPanelOpen, setMobileContextOpen } = useWorkspaceStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const isMobile = useMediaQuery("(max-width: 767px)");

  const closePanel = () => {
    if (isMobile) setMobileContextOpen(false);
    else setContextPanelOpen(false);
  };

  const toggleSection = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const wordCount = messages.reduce((acc, m) => acc + m.content.split(/\s+/).filter(Boolean).length, 0);
  const charCount = messages.reduce((acc, m) => acc + m.content.length, 0);
  const estTokens = Math.round(charCount / 4);

  const attachments = useMemo(() => {
    const seen = new Map<string, (typeof messages)[number]["attachments"][number]>();
    for (const m of messages) {
      for (const a of m.attachments) {
        if (!seen.has(a.id)) seen.set(a.id, a);
      }
    }
    return Array.from(seen.values());
  }, [messages]);

  return (
    <aside aria-label="AI Context panel" className="h-full bg-sidebar/30 backdrop-blur-2xl border-l border-border/20 flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">AI Context</span>
        </div>
        <button
          onClick={closePanel}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          aria-label="Close context panel"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-2.5">
        <Section id="summary" label="Conversation" icon={MessageSquare} collapsed={collapsed} onToggle={toggleSection}>
          <SummarySection currentChat={currentChat} selectedTone={selectedTone} />
        </Section>

        <Section id="settings" label="Active Settings" icon={Sliders} collapsed={collapsed} onToggle={toggleSection}>
          <ActiveSettings context={context} />
        </Section>

        <Section id="stats" label="Statistics" icon={BarChart3} collapsed={collapsed} onToggle={toggleSection}>
          <StatsSection messages={messages} wordCount={wordCount} charCount={charCount} estTokens={estTokens} />
        </Section>

        <Section id="personas" label="Personas" icon={User} collapsed={collapsed} onToggle={toggleSection}>
          <PersonasSection />
        </Section>

        <Section id="files" label="Attachments" icon={Paperclip} collapsed={collapsed} onToggle={toggleSection}>
          <AttachmentsSection attachments={attachments} />
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
function SummarySection({ currentChat, selectedTone }: any) {
  const tone = TONES.find((t) => t.id === selectedTone);
  return (
    <div className="space-y-2.5">
      <InfoRow icon={MessageSquare} label="Title" value={currentChat?.title || "Untitled"} />
      <InfoRow icon={Palette} label="Tone" value={tone?.label || selectedTone} color={tone?.color} />
      <InfoRow icon={Hash} label="Messages" value={currentChat?._count?.messages ?? 0} />
      <InfoRow icon={Clock} label="Created" value={currentChat?.createdAt ? new Date(currentChat.createdAt).toLocaleDateString() : "—"} />
    </div>
  );
}

function ActiveSettings({ context }: { context: { platform: string; language: string; length: string; formality: string; emojis: boolean; creativity: number; audience: string } }) {
  const setContext = useChatStore((s) => s.setContext);

  return (
    <div className="space-y-3">
      {/* Platform */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-micro text-muted-foreground/60">
          <Globe className="w-3 h-3" />
          <span>Platform</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {PLATFORMS.map((p) => (
            <button
              key={p.name}
              onClick={() => setContext({ platform: p.name.toLowerCase() })}
              className={cn(
                "px-2 py-1 rounded-md text-nano font-medium border transition-all",
                context.platform === p.name.toLowerCase()
                  ? "bg-primary/10 border-primary/40 text-foreground"
                  : "border-border/30 text-muted-foreground/60 hover:text-foreground hover:border-border/60"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Language + Formality row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-micro text-muted-foreground/60">
            <Languages className="w-3 h-3" />
            <span>Language</span>
          </div>
          <select
            value={context.language}
            onChange={(e) => setContext({ language: e.target.value })}
            className="w-full h-8 rounded-lg bg-muted/30 border border-border/30 px-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-micro text-muted-foreground/60">
            <Smile className="w-3 h-3" />
            <span>Formality</span>
          </div>
          <div className="flex gap-1">
            {(["casual", "neutral", "formal"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setContext({ formality: f })}
                className={cn(
                  "flex-1 px-1 py-1.5 rounded-md text-nano font-medium border transition-all capitalize",
                  context.formality === f
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "border-border/30 text-muted-foreground/60 hover:text-foreground hover:border-border/60"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Length */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-micro text-muted-foreground/60">
          <Hash className="w-3 h-3" />
          <span>Length</span>
        </div>
        <div className="flex gap-1">
          {(["short", "medium", "long"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setContext({ length: l })}
              className={cn(
                "flex-1 px-2 py-1.5 rounded-md text-nano font-medium border transition-all capitalize",
                context.length === l
                  ? "bg-primary/10 border-primary/40 text-foreground"
                  : "border-border/30 text-muted-foreground/60 hover:text-foreground hover:border-border/60"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Creativity slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-micro text-muted-foreground/60">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            <span>Creativity</span>
          </div>
          <span className="font-medium text-foreground/70">{context.creativity}%</span>
        </div>
        <Slider
          value={[context.creativity]}
          onValueChange={(val) => setContext({ creativity: val[0] })}
          max={100}
          step={5}
          className="w-full"
        />
      </div>

      {/* Emojis toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-micro text-muted-foreground/60">
          <Smile className="w-3 h-3" />
          <span>Emojis</span>
        </div>
        <Switch
          checked={context.emojis}
          onCheckedChange={(checked) => setContext({ emojis: checked })}
          aria-label="Toggle emojis"
        />
      </div>

      {/* Audience */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-micro text-muted-foreground/60">
          <Target className="w-3 h-3" />
          <span>Audience</span>
        </div>
        <input
          value={context.audience}
          onChange={(e) => setContext({ audience: e.target.value })}
          placeholder="Who is this for? e.g. founders"
          className="w-full h-8 rounded-lg bg-muted/30 border border-border/30 px-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
        />
      </div>

      <p className="text-micro text-muted-foreground/40 pt-0.5 flex items-center gap-1">
        <Check className="w-3 h-3 text-emerald-500/70" />
        Applied to every message in this conversation.
      </p>
    </div>
  );
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "ko", label: "Korean" },
];

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
      <InfoRow icon={Brain} label="AI responses" value={aiMsgs} />
      <InfoRow icon={FileText} label="Word count" value={wordCount.toLocaleString()} />
      <InfoRow icon={Hash} label="Characters" value={charCount.toLocaleString()} />
      <InfoRow icon={Zap} label="Est. tokens" value={estTokens.toLocaleString()} />
      <InfoRow icon={Clock} label="Reading time" value={`${readingTime} min`} />
    </div>
  );
}

function PersonasSection() {
  const selectedPersona = useChatStore((s) => s.selectedPersona);
  const setSelectedPersona = useChatStore((s) => s.setSelectedPersona);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [defaultPersonaId, setDefaultPersonaId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ personas: Persona[]; defaultPersonaId: string | null }>("/api/personas")
      .then((data) => {
        if (cancelled) return;
        setPersonas(data.personas ?? []);
        setDefaultPersonaId(data.defaultPersonaId ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (personas.length === 0) {
    return (
      <p className="text-tiny text-muted-foreground/50">
        No personas yet. Create one to apply a consistent voice.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {personas.map((persona) => {
        const active = selectedPersona === persona.id || (selectedPersona === null && persona.id === defaultPersonaId);
        return (
          <button
            key={persona.id}
            onClick={() => setSelectedPersona(active ? null : persona.id)}
            className={cnPersonaRow(active)}
            aria-pressed={active}
          >
            <span
              className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-tiny"
              style={{ backgroundColor: `${persona.color}22`, color: persona.color }}
            >
              {persona.icon || persona.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-xs font-medium truncate">
                {persona.name}
                {persona.id === defaultPersonaId && (
                  <span className="ml-1.5 text-nano px-1.5 py-0.5 rounded-full bg-primary/10 text-primary align-middle">default</span>
                )}
              </span>
              {persona.description && (
                <span className="block text-micro text-muted-foreground/60 truncate">{persona.description}</span>
              )}
            </span>
            {active && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

function cnPersonaRow(active: boolean) {
  return [
    "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border transition-all",
    active
      ? "bg-primary/10 border-primary/30"
      : "border-transparent hover:bg-muted/30",
  ].join(" ");
}

function AttachmentsSection({ attachments }: { attachments: { id: string; fileName: string; fileSize: number; fileType: string }[] }) {
  if (attachments.length === 0) {
    return (
      <p className="text-tiny text-muted-foreground/50">
        No attachments in this conversation.
      </p>
    );
  }
  return (
    <div className="space-y-1.5">
      {attachments.map((a) => (
        <div key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/20 text-xs">
          <Paperclip className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <span className="flex-1 truncate">{a.fileName}</span>
          <span className="text-micro text-muted-foreground/50 shrink-0">{formatBytes(a.fileSize)}</span>
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
      <div className="flex items-center justify-between text-micro text-muted-foreground/60">
        <span>Context usage</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: ease.out }}
          className="h-full rounded-full bg-brand"
        />
      </div>
      <p className="text-micro text-muted-foreground/40">{wordCount} words · ~{estTokens.toLocaleString()} tokens</p>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
