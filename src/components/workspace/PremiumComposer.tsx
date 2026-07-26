"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Mic, Loader2, Plus, X, ChevronDown, ChevronUp, Sliders,
  Globe, Hash, Type,
} from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { SmartSuggestions } from "./SmartSuggestions";
import { cn } from "@/lib/utils";
import { TONES } from "@/lib/constants";
import { spring, duration, ease } from "@/styles/motion";

interface PremiumComposerProps {
  chatId: string;
  onSend: (content: string, chatId: string) => Promise<void>;
}

export function PremiumComposer({ chatId, onSend }: PremiumComposerProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isLoading, selectedTone, setSelectedTone } = useChatStore();
  const { showAdvancedControls, toggleAdvancedControls, showSuggestions, advanced } = useWorkspaceStore();

  const charCount = input.length;
  const estTokens = Math.round(charCount / 4);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const content = input.trim();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await onSend(content, chatId);
  }, [input, isLoading, chatId, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Enter" && e.shiftKey) {
      }
    },
    [handleSubmit]
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

  const currentTone = TONES.find((t) => t.id === selectedTone);

  return (
    <div className="border-t border-border/20 bg-background/60 backdrop-blur-xl">
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
        <div className="px-4 pb-4 pt-2">
          <div
            className={cn(
              "relative rounded-2xl border transition-all duration-200 bg-background/40 backdrop-blur-sm",
              isFocused
                ? "border-primary/30 shadow-glow bg-muted/10"
                : "border-border/20 hover:border-border/40"
            )}
          >
            {/* Tone bar */}
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const nextIndex = (TONES.findIndex((t) => t.id === selectedTone) + 1) % TONES.length;
                    setSelectedTone(TONES[nextIndex].id);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium border border-border/30 hover:bg-muted/30 transition-all"
                  style={{ borderColor: currentTone?.color ? `${currentTone.color}40` : undefined, color: currentTone?.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTone?.color }} />
                  {currentTone?.label || "Tone"}
                  <ChevronDown className="w-2.5 h-2.5 opacity-50" />
                </button>
                <button
                  onClick={toggleAdvancedControls}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
                    showAdvancedControls
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/30 text-muted-foreground/70 hover:bg-muted/30"
                  )}
                >
                  <Sliders className="w-2.5 h-2.5" />
                  Controls
                  {showAdvancedControls ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                </button>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
                {input && (
                  <>
                    <span>{charCount} chars</span>
                    <span className="w-px h-3 bg-border/30" />
                    <span>~{estTokens} tokens</span>
                    <span className="w-px h-3 bg-border/30" />
                  </>
                )}
                {isLoading ? (
                  <span className="text-primary/70 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Generating...
                  </span>
                ) : (
                  <span className="hidden sm:inline">⌘Enter to send</span>
                )}
              </div>
            </div>

            {/* Textarea */}
            <div className="flex items-end gap-2 px-3 pb-2">
              <button
                className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-all mb-0.5"
                title="Attach file"
                aria-label="Attach file"
              >
                <Plus className="w-4 h-4" />
              </button>

              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Write your message... (/) for commands"
                  className="w-full bg-transparent border-0 focus-visible:ring-0 resize-none py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground/40 min-h-[44px] max-h-[240px] outline-none"
                  rows={1}
                  disabled={isLoading}
                  aria-label="Message input"
                />
              </div>

              <div className="flex items-center gap-1 shrink-0 mb-0.5">
                <button
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-all"
                  title="Voice input"
                  aria-label="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <motion.div whileTap={{ scale: 0.95 }}>
                  <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                      input.trim() && !isLoading
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-glow hover:from-violet-500 hover:to-indigo-500"
                        : "bg-muted/30 text-muted-foreground/50"
                    )}
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Loader2 className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Stop generation button */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex justify-center mt-2"
              >
                <button
                  onClick={() => {
                    useChatStore.getState().setIsLoading(false);
                    useChatStore.getState().clearStreamingContent();
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-medium border border-border/30 bg-background/60 backdrop-blur-sm hover:bg-muted/30 transition-all"
                >
                  <div className="w-3 h-3 rounded-sm bg-destructive/80" />
                  Stop generation
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AdvancedControlsPanel() {
  const { advanced, setAdvanced } = useWorkspaceStore();
  const row = "flex items-center justify-between";
  const labelClass = "text-[11px] text-muted-foreground/70";

  const controls = [
    { label: "Language", icon: Globe, key: "language", type: "select", options: [{ value: "en", label: "English" }, { value: "es", label: "Spanish" }, { value: "fr", label: "French" }, { value: "de", label: "German" }, { value: "zh", label: "Chinese" }, { value: "ja", label: "Japanese" }] },
    { label: "Audience", icon: Hash, key: "audience", type: "text" },
    { label: "Writing Style", icon: Type, key: "writingStyle", type: "select", options: [{ value: "balanced", label: "Balanced" }, { value: "descriptive", label: "Descriptive" }, { value: "persuasive", label: "Persuasive" }, { value: "direct", label: "Direct" }] },
    { label: "Reading Level", icon: BookIcon, key: "readingLevel", type: "select", options: [{ value: "basic", label: "Basic" }, { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" }] },
    { label: "Output Format", icon: FileIcon, key: "outputFormat", type: "select", options: [{ value: "text", label: "Plain Text" }, { value: "markdown", label: "Markdown" }, { value: "html", label: "HTML" }] },
  ] as const;

  return (
    <div className="mx-4 mt-2 p-3.5 rounded-xl border border-border/20 bg-muted/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-primary" />
          Advanced Controls
        </span>
        <button
          onClick={() => useWorkspaceStore.getState().setShowAdvancedControls(false)}
          className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {controls.map((control) => (
          <div key={control.key} className={row}>
            <span className={labelClass}>{control.label}</span>
            {"options" in control ? (
              <select
                value={String((advanced as any)[control.key] || "")}
                onChange={(e) => setAdvanced({ [control.key]: e.target.value })}
                className="text-[11px] bg-muted/30 border border-border/30 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary/30 max-w-[130px]"
              >
                {control.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                value={String((advanced as any)[control.key] || "")}
                onChange={(e) => setAdvanced({ [control.key]: e.target.value })}
                className="text-[11px] bg-muted/30 border border-border/30 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary/30 w-[130px]"
                placeholder="Enter value..."
              />
            )}
          </div>
        ))}
        <div className={row}>
          <span className={labelClass}>Creativity</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={advanced.creativity}
              onChange={(e) => setAdvanced({ creativity: Number(e.target.value) })}
              className="w-20 h-1 accent-primary"
            />
            <span className="text-[10px] text-muted-foreground/60 w-6 text-right">{advanced.creativity}%</span>
          </div>
        </div>
        <div className={row}>
          <span className={labelClass}>Emoji Level</span>
          <select
            value={advanced.emojiLevel}
            onChange={(e) => setAdvanced({ emojiLevel: e.target.value as any })}
            className="text-[11px] bg-muted/30 border border-border/30 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary/30"
          >
            <option value="none">None</option>
            <option value="subtle">Subtle</option>
            <option value="moderate">Moderate</option>
            <option value="heavy">Heavy</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function BookIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
}

function FileIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
}
