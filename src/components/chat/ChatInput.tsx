"use client";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, Mic, Loader2, FileText, Bold, Italic, List, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TONES } from "@/lib/constants";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  chatId: string;
  onSend: (content: string, chatId: string) => Promise<void>;
}

export function ChatInput({ chatId, onSend }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isLoading, selectedTone, setSelectedTone } = useChatStore();

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const content = input.trim();
    setInput("");
    await onSend(content, chatId);
  }, [input, isLoading, chatId, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const currentTone = TONES.find((t) => t.id === selectedTone);

  return (
    <div className="border-t border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-200">
      <div className="max-w-4xl mx-auto p-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {[
              { icon: Bold, label: "Bold", shortcut: "⌘B" },
              { icon: Italic, label: "Italic", shortcut: "⌘I" },
              { icon: List, label: "List", shortcut: "⌘L" },
              { icon: LinkIcon, label: "Link", shortcut: "⌘K" },
              { icon: Paperclip, label: "Media", shortcut: "⌘M" },
            ].map((tool) => (
              <motion.button
                key={tool.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title={`${tool.label} (${tool.shortcut})`}
              >
                <tool.icon className="w-4 h-4" />
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {["File", "Screenshot"].map((label) => (
              <Button key={label} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg">
                {label === "File" && <FileText className="w-3.5 h-3.5" />}
                {label === "Screenshot" && <Paperclip className="w-3.5 h-3.5" />}
              </Button>
            ))}
          </div>
        </div>

        {/* Tone selector */}
        <div className="flex items-center gap-2 mb-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const nextIndex = (TONES.findIndex((t) => t.id === selectedTone) + 1) % TONES.length;
              setSelectedTone(TONES[nextIndex].id);
            }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 hover:bg-muted/80"
            style={{ borderColor: currentTone?.color, color: currentTone?.color }}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentTone?.color }}
            />
            {currentTone?.label}
            <svg className="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </motion.button>
          <span className="text-[10px] text-muted-foreground">
            {isLoading ? "AI is thinking..." : "⌘+Enter to send"}
          </span>
        </div>

        {/* Input Area */}
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl p-1.5 border transition-all duration-200",
            isFocused
              ? "border-primary/30 shadow-glow bg-muted/20"
              : "border-border/40 hover:border-border bg-muted/10"
          )}
        >
          {/* Attach button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pb-2 pl-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
          </motion.div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Write your message..."
            className="min-h-[48px] max-h-[200px] bg-transparent border-0 focus-visible:ring-0 resize-none py-3 text-sm leading-relaxed placeholder:text-muted-foreground/50 flex-1"
            rows={1}
            disabled={isLoading}
          />

          {/* Voice button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pb-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
              title="Voice input"
            >
              <Mic className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Send button */}
          <motion.div
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
            transition={{ duration: 0.15 }}
            className="pb-2 pr-2"
          >
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              size="icon"
              className={cn(
                "rounded-xl transition-all duration-200 shadow-glow",
                input.trim() && !isLoading
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                  : ""
              )}
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Loader2 className="w-5 h-5" />
                </motion.div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
