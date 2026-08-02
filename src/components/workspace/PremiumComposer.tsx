"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Mic, Loader2, X, ChevronDown, Sliders,
  Globe, Paperclip, Square, Check, Wand2,
} from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { SmartSuggestions } from "./SmartSuggestions";
import { ToolPicker } from "./ToolPicker";
import { TonePicker } from "./TonePicker";
import { PickerSurface } from "./PickerSurface";
import type { ToolDefinition } from "@/components/tools/ToolDefinitions";
import { cn } from "@/lib/utils";
import { TONES, PLATFORMS } from "@/lib/constants";
import { duration, ease } from "@/styles/motion";
import { toast } from "sonner";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "text/plain", "text/html", "text/css",
  "text/javascript", "application/json", "application/xml",
  "audio/mpeg", "audio/wav",
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface PremiumComposerProps {
  chatId: string;
  onSend: (content: string, chatId: string) => Promise<void>;
  onStop?: () => void;
}

interface PendingAttachment {
  id: string;
  file: File;
}

export function PremiumComposer({ chatId, onSend, onStop }: PremiumComposerProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [openPicker, setOpenPicker] = useState<"tone" | "platform" | "tool" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toolLoading, setToolLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { isLoading, selectedTone, context, setContext } = useChatStore();
  const { showAdvancedControls, toggleAdvancedControls, showSuggestions } = useWorkspaceStore();

  // Close tone/platform pickers when clicking outside the toolbar
  useEffect(() => {
    if (!openPicker) return;
    const onPointerDown = (e: PointerEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenPicker(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openPicker]);

  const charCount = input.length;
  const estTokens = Math.round(charCount / 4);
  const currentTone = TONES.find((t) => t.id === selectedTone);
  const currentPlatform = PLATFORMS.find((p) => p.name.toLowerCase() === context.platform);

  const stopGeneration = useCallback(() => {
    onStop?.();
    useChatStore.getState().setIsLoading(false);
    useChatStore.getState().clearStreamingContent();
  }, [onStop]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading || uploading) return;
    const content = input.trim();
    const files = attachments.map((a) => a.file);
    setInput("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    if (files.length) {
      setUploading(true);
      try {
        await Promise.all(files.map(uploadFile));
        toast.success(`${files.length} file${files.length > 1 ? "s" : ""} attached`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    }
    await onSend(content, chatId);
  }, [input, isLoading, uploading, attachments, chatId, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const accepted: PendingAttachment[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        rejected.push(file.name);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} (>5MB)`);
        continue;
      }
      accepted.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file });
    }
    if (accepted.length) setAttachments((prev) => [...prev, ...accepted]);
    if (rejected.length) toast.error(`Skipped: ${rejected.join(", ")} — unsupported type or >5MB`);
    e.target.value = "";
  }, []);

  const applyTool = useCallback(async (tool: ToolDefinition) => {
    setOpenPicker(null);
    const current = input.trim();
    if (!current) {
      setInput(`${tool.title}: `);
      toast.info(`Picked ${tool.title} — type what you want it applied to`);
      return;
    }
    setToolLoading(true);
    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: tool.id,
          input: current,
          tone: selectedTone,
          platform: context.platform,
          language: context.language,
          length: context.length,
          creativity: context.creativity,
          formality: context.formality,
          audience: context.audience,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Tool execution failed");
      }
      const result = await res.json();
      setInput(result.content || "");
      toast.success(`Applied ${tool.title}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tool execution failed");
    } finally {
      setToolLoading(false);
    }
  }, [input, selectedTone, context]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

  return (
    <div className="border-t border-border/20 bg-background/60 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-4xl mx-auto">
        {/* Smart Suggestions */}
        <AnimatePresence>
          {showSuggestions && !isFocused && !input && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: duration.fast }}
            >
              <SmartSuggestions chatId={chatId} onSend={onSend} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Controls */}
        <AnimatePresence>
          {showAdvancedControls && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: ease.default }}
              className="overflow-hidden"
            >
              <AdvancedControlsPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composer */}
        <div className="px-3 sm:px-4 pb-3 pt-2">
          <div
            className={cn(
              "relative rounded-2xl border transition-all duration-200 bg-background/40 backdrop-blur-sm",
              isFocused
                ? "border-primary/30 shadow-glow bg-muted/10"
                : "border-border/20 hover:border-border/40"
            )}
          >
            {/* Attachment chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
                {attachments.map((a) => (
                  <span
                    key={a.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30 border border-border/30 text-[10px]"
                  >
                    <Paperclip className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                    <span className="max-w-[140px] truncate">{a.file.name}</span>
                    <span className="text-muted-foreground/50 shrink-0">{(a.file.size / 1024).toFixed(0)}KB</span>
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                      className="text-muted-foreground/50 hover:text-foreground transition-colors shrink-0"
                      aria-label={`Remove ${a.file.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isLoading ? "Generating response..." : "Write your message... (/) for commands"}
              className="w-full bg-transparent border-0 focus-visible:ring-0 resize-none px-4 pt-3 pb-1 text-sm leading-relaxed placeholder:text-muted-foreground/40 min-h-[44px] max-h-[240px] outline-none disabled:opacity-60"
              rows={1}
              disabled={isLoading || uploading}
              aria-label="Message input"
            />

            {/* Toolbar */}
            <div ref={toolbarRef} className="flex items-center justify-between px-2 pb-1.5 pt-0.5">
              <div className="flex items-center gap-0.5">
                <input
                  ref={attachRef}
                  type="file"
                  multiple
                  onChange={handleFiles}
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <ToolbarButton
                  onClick={() => attachRef.current?.click()}
                  disabled={isLoading}
                  label="Attach files"
                >
                  <Paperclip className="w-4 h-4" />
                </ToolbarButton>

                {/* Tone picker */}
                <div className="relative">
                  <ToolbarButton
                    onClick={() => setOpenPicker(openPicker === "tone" ? null : "tone")}
                    active={openPicker === "tone"}
                    disabled={isLoading}
                    label="Select tone"
                    aria-expanded={openPicker === "tone"}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: currentTone?.color }}
                    />
                    <span className="text-xs font-medium">{currentTone?.label || "Tone"}</span>
                    <ChevronDown className={cn("w-3 h-3 opacity-50 transition-transform", openPicker === "tone" && "rotate-180")} />
                  </ToolbarButton>
                  <AnimatePresence>
                    {openPicker === "tone" && (
                      <TonePicker onSelect={() => setOpenPicker(null)} onClose={() => setOpenPicker(null)} />
                    )}
                  </AnimatePresence>
                </div>

                {/* Platform picker */}
                <div className="relative">
                  <ToolbarButton
                    onClick={() => setOpenPicker(openPicker === "platform" ? null : "platform")}
                    active={openPicker === "platform"}
                    disabled={isLoading}
                    label="Select platform"
                    aria-expanded={openPicker === "platform"}
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">{currentPlatform?.name || "Platform"}</span>
                    <ChevronDown className={cn("w-3 h-3 opacity-50 transition-transform", openPicker === "platform" && "rotate-180")} />
                  </ToolbarButton>
                  <AnimatePresence>
                    {openPicker === "platform" && (
                      <PickerSurface label="Platform" onClose={() => setOpenPicker(null)} className="w-[200px] bottom-full left-0 mb-1.5">
                        <div className="max-h-64 overflow-y-auto scrollbar-thin">
                          {PLATFORMS.map((platform) => {
                            const id = platform.name.toLowerCase();
                            const active = context.platform === id;
                            return (
                              <button
                                key={id}
                                onClick={() => { setContext({ platform: id }); setOpenPicker(null); }}
                                className={cn(
                                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                                  active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                                )}
                              >
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: platform.color }} />
                                <span className="flex-1 truncate">{platform.name}</span>
                                {active && <Check className="w-3.5 h-3.5 text-primary" />}
                              </button>
                            );
                          })}
                        </div>
                      </PickerSurface>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tool picker */}
                <div className="relative">
                  <ToolbarButton
                    onClick={() => setOpenPicker(openPicker === "tool" ? null : "tool")}
                    active={openPicker === "tool"}
                    disabled={isLoading}
                    label="Pick a tool"
                    aria-expanded={openPicker === "tool"}
                  >
                    {toolLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium hidden sm:inline">Tools</span>
                    <ChevronDown className={cn("w-3 h-3 opacity-50 transition-transform", openPicker === "tool" && "rotate-180")} />
                  </ToolbarButton>
                  <AnimatePresence>
                    {openPicker === "tool" && (
                      <ToolPicker onSelect={applyTool} onClose={() => setOpenPicker(null)} loading={toolLoading} />
                    )}
                  </AnimatePresence>
                </div>

                {/* Advanced controls toggle */}
                <ToolbarButton
                  onClick={toggleAdvancedControls}
                  active={showAdvancedControls}
                  label="Advanced controls"
                >
                  <Sliders className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:inline">Controls</span>
                </ToolbarButton>
              </div>

              <div className="flex items-center gap-2">
                {!isLoading && input && (
                  <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap">
                    {charCount} chars · ~{estTokens} tokens
                  </span>
                )}
                {!isLoading && !input && (
                  <span className="hidden md:inline text-[10px] text-muted-foreground/40 whitespace-nowrap">⌘Enter to send</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-40"
                    title="Voice input — coming soon"
                    aria-label="Voice input (coming soon)"
                    disabled
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {isLoading ? (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <button
                        onClick={stopGeneration}
                        className="h-10 w-10 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                        aria-label="Stop generating"
                      >
                        <Square className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-current" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      onClick={handleSubmit}
                      disabled={!input.trim() || uploading}
                      className={cn(
                        "h-10 w-10 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50",
                        input.trim() && !uploading
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-glow hover:from-violet-500 hover:to-indigo-500"
                          : "bg-muted/30 text-muted-foreground/50"
                      )}
                      aria-label="Send message"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick, active, disabled, label, children, "aria-expanded": ariaExpanded,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
  "aria-expanded"?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-expanded={ariaExpanded}
      className={cn(
        "flex items-center gap-1.5 px-2 h-9 sm:h-8 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-40",
        active && "text-primary bg-primary/10"
      )}
    >
      {children}
    </button>
  );
}

async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
}

function AdvancedControlsPanel() {
  const { context, setContext } = useChatStore();

  const selects: { label: string; key: "language" | "length" | "formality"; options: { value: string; label: string }[] }[] = [
    {
      label: "Language", key: "language",
      options: [
        { value: "en", label: "English" }, { value: "es", label: "Spanish" },
        { value: "fr", label: "French" }, { value: "de", label: "German" },
        { value: "zh", label: "Chinese" }, { value: "ja", label: "Japanese" },
      ],
    },
    {
      label: "Response Length", key: "length",
      options: [
        { value: "short", label: "Short" }, { value: "medium", label: "Medium" },
        { value: "long", label: "Long" },
      ],
    },
    {
      label: "Formality", key: "formality",
      options: [
        { value: "casual", label: "Casual" }, { value: "neutral", label: "Neutral" },
        { value: "formal", label: "Formal" },
      ],
    },
  ];

  const selectClass = "text-[11px] bg-muted/30 border border-border/30 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary/30 max-w-[130px]";

  return (
    <div className="mx-3 sm:mx-4 mt-2 p-3.5 rounded-xl border border-border/20 bg-muted/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-primary" />
          Advanced Controls
        </span>
        <button
          onClick={() => useWorkspaceStore.getState().setShowAdvancedControls(false)}
          className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
          aria-label="Close advanced controls"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
        {selects.map((control) => (
          <div key={control.key} className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground/70">{control.label}</span>
            <select
              value={String(context[control.key])}
              onChange={(e) => setContext({ [control.key]: e.target.value })}
              className={selectClass}
            >
              {control.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/70">Audience</span>
          <input
            value={context.audience}
            onChange={(e) => setContext({ audience: e.target.value })}
            placeholder="e.g. customers, team"
            className="text-[11px] bg-muted/30 border border-border/30 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary/30 w-[130px]"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/70">Emojis</span>
          <button
            onClick={() => setContext({ emojis: !context.emojis })}
            role="switch"
            aria-checked={context.emojis}
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              context.emojis ? "bg-primary" : "bg-muted-foreground/20"
            )}
          >
            <span className={cn(
              "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
              context.emojis && "translate-x-4"
            )} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/70">Creativity</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={context.creativity}
              onChange={(e) => setContext({ creativity: Number(e.target.value) })}
              className="w-20 h-1 accent-primary"
              aria-label="Creativity"
            />
            <span className="text-[10px] text-muted-foreground/60 w-6 text-right">{context.creativity}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
