"use client";
import { useState, useCallback, memo } from "react";
import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { TONES } from "@/lib/constants";
import { useChatStore } from "@/stores/chat-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import { api } from "@/lib/api-client";
import {
  User, Bot, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown,
  Bookmark, FileText, Pencil, Paperclip, Feather,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { toast } from "sonner";
import { messageVariants, spring, ease, duration } from "@/styles/motion";

interface PremiumMessageCardProps {
  message: Message;
  isStreaming?: boolean;
  isLastMessage?: boolean;
  onRegenerate?: (messageId: string) => void;
}

/**
 * Editorial note layout: assistant responses read like annotated manuscript
 * pages — generous vertical rhythm, a quiet hairline rule, and a byline row
 * (tone · platform) instead of a chat-bubble shell.
 */
export const PremiumMessageCard = memo(function PremiumMessageCard({
  message, isStreaming, isLastMessage, onRegenerate,
}: PremiumMessageCardProps) {
  const isUser = message.role === "user";
  const tone = message.tone ? TONES.find((t) => t.id === message.tone) : null;
  const isTouch = useMediaQuery("(hover: none)");
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  const bookmarkKey = `tc:bookmark:${message.id}`;
  const bookmarked = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      window.addEventListener("tc-bookmark", onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener("tc-bookmark", onChange);
      };
    },
    () => {
      try {
        return localStorage.getItem(bookmarkKey) === "1";
      } catch {
        return false;
      }
    },
    () => false
  );

  const actionsVisible = !isStreaming && (isTouch || showActions || isLastMessage);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleCopyCode = useCallback(async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success("Code copied");
  }, []);

  const handleEdit = useCallback(async () => {
    const content = draft.trim();
    if (!content) return;
    try {
      await api(`/api/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      useChatStore.getState().updateMessage(message.id, content);
      toast.success("Message updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update message");
    }
  }, [draft, message.id]);

  const handleFeedback = useCallback(async (value: "liked" | "disliked") => {
    const next = message.feedback === value ? null : value;
    try {
      await api(`/api/messages/${message.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: next }),
      });
      useChatStore.getState().updateMessageInList(message.id, { feedback: next });
    } catch {
      toast.error("Failed to save feedback");
    }
  }, [message.id, message.feedback]);

  const toggleBookmark = useCallback(() => {
    const next = !bookmarked;
    try {
      localStorage.setItem(bookmarkKey, next ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event("tc-bookmark"));
    toast.success(next ? "Bookmarked" : "Removed bookmark");
  }, [bookmarked, bookmarkKey]);

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      variants={isUser ? messageVariants.outgoing : messageVariants.incoming}
      initial="initial"
      animate="animate"
      transition={{ duration: duration.normal, ease: ease.emphasized }}
      className={cn(
        "flex gap-3 sm:gap-4 px-3 sm:px-6 w-full max-w-4xl mx-auto group",
        isUser ? "justify-end py-2.5" : "justify-start py-5"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onFocusCapture={() => setShowActions(true)}
      onBlurCapture={() => setShowActions(false)}
    >
      {!isUser && (
        <div className="relative shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center shadow-[0_4px_16px_-4px_hsl(var(--brand)/0.5)]">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <div className={cn("relative min-w-0", isUser ? "max-w-[82%]" : "flex-1")}>
        {/* Editorial byline for AI notes */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2.5">
            <span className="flex items-center gap-1.5 text-[13px] font-display tracking-tight text-foreground/85">
              <Feather className="w-3 h-3 text-brand/80" aria-hidden="true" />
              ToneCraft
            </span>
            {tone && !isStreaming && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-border/40 bg-muted/30 text-[10px] font-medium text-muted-foreground/80">
                <span aria-hidden="true">{tone.emoji}</span>
                {tone.label}
              </span>
            )}
            {message.platform && message.platform !== "general" && !isStreaming && (
              <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-border/40 bg-muted/30 text-[10px] font-medium text-muted-foreground/60">
                <Paperclip className="w-2.5 h-2.5" aria-hidden="true" />
                {message.platform}
              </span>
            )}
          </div>
        )}

        {/* Assistant note body */}
        {!isUser && (
          <div className={cn(
            "relative pl-4 sm:pl-5 border-l-2 border-border/40 rounded-r-xl",
            isStreaming && "border-primary/40"
          )}>
            {/* Metadata panel */}
            <AnimatePresence>
              {showMeta && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: duration.fast }}
                  className="mb-3 p-2.5 rounded-xl bg-muted/40 border border-border/20 text-micro text-muted-foreground space-y-1 overflow-hidden"
                >
                  {message.tokens && <MetaRow label="Tokens" value={message.tokens.toLocaleString()} />}
                  {message.latency && <MetaRow label="Latency" value={`${(message.latency / 1000).toFixed(1)}s`} />}
                  {message.platform && message.platform !== "general" && <MetaRow label="Platform" value={message.platform} />}
                  <MetaRow label="Time" value={formatTime(message.createdAt)} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-[1.85] prose-p:my-3 prose-headings:tracking-tight prose-headings:font-semibold">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  pre: ({ children }) => (
                    <pre className="bg-muted/80 rounded-xl p-4 overflow-x-auto my-3 group/pre relative border border-border/20">
                      <button
                        onClick={() => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const codeEl = (children as any)?.props?.children;
                          const code = typeof codeEl === "string" ? codeEl : "";
                          handleCopyCode(code);
                        }}
                        className="absolute top-2.5 right-2.5 opacity-0 group-hover/pre:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 p-1.5 rounded-lg bg-background/60 hover:bg-background/80 border border-border/20 transition-all"
                        aria-label="Copy code"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {children}
                    </pre>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="bg-muted/80 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono border border-border/20" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary transition-all"
                    >
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-xl border border-border/20">
                      <table className="min-w-full divide-y divide-border/20">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground bg-muted/30">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2.5 text-sm border-t border-border/10">{children}</td>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-primary/30 pl-4 italic text-muted-foreground/80 my-3">
                      {children}
                    </blockquote>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside space-y-1.5 my-2 ml-4">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside space-y-1.5 my-2 ml-4">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-[15px] leading-[1.85] marker:text-muted-foreground/40">{children}</li>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Streaming cursor */}
            {isStreaming && (
              <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-medium text-muted-foreground/60">
                <motion.span
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                  className="flex gap-0.5"
                  aria-hidden="true"
                >
                  <span className="w-1 h-1 rounded-full bg-primary/70" />
                  <span className="w-1 h-1 rounded-full bg-primary/70" />
                  <span className="w-1 h-1 rounded-full bg-primary/70" />
                </motion.span>
                writing
              </span>
            )}

            {/* Attachments referenced by the note */}
            {message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {message.attachments.map((a) => (
                  <span
                    key={a.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-micro bg-muted/20 border-border/20 text-muted-foreground/70"
                    title={a.fileName}
                  >
                    <Paperclip className="w-3 h-3 shrink-0" />
                    <span className="max-w-[160px] truncate">{a.fileName}</span>
                    <span className="shrink-0 text-muted-foreground/50">
                      {formatBytes(a.fileSize)}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* Timestamp + tokens */}
            {!isStreaming && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-micro text-muted-foreground/40">
                  {formatTime(message.createdAt)}
                </span>
                {message.tokens ? (
                  <span className="text-nano text-muted-foreground/30">
                    {message.tokens.toLocaleString()} tokens
                  </span>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* User message — compact right-aligned note */}
        {isUser && (
          <div className="flex flex-col items-end">
            <div className="relative rounded-2xl rounded-br-md px-4 py-3 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-glow max-w-full">
              {editing ? (
                <div className="min-w-[280px]">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={Math.max(2, draft.split("\n").length)}
                    className="w-full bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg px-3 py-2 text-sm text-primary-foreground placeholder:text-primary-foreground/40 outline-none focus:ring-2 focus:ring-primary-foreground/30 resize-none"
                    aria-label="Edit message"
                  />
                  <div className="flex items-center justify-end gap-1.5 mt-2">
                    <button
                      onClick={() => { setEditing(false); setDraft(message.content); }}
                      className="h-7 px-2.5 rounded-lg text-xs text-primary-foreground/70 hover:bg-primary-foreground/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEdit}
                      disabled={!draft.trim()}
                      className="h-7 px-3 rounded-lg bg-primary-foreground/15 hover:bg-primary-foreground/25 text-xs font-medium transition-all disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[15px] leading-[1.85] whitespace-pre-wrap text-primary-foreground/90">
                    {message.content}
                  </p>
                  {message.isEdited && (
                    <span className="text-micro text-primary-foreground/50 mt-1.5 block">(edited)</span>
                  )}
                  <span className="text-micro text-primary-foreground/50 block mt-1.5">
                    {formatTime(message.createdAt)}
                  </span>
                </>
              )}
            </div>

            {/* Attachments under the note */}
            {message.attachments.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1.5 mt-2">
                {message.attachments.map((a) => (
                  <span
                    key={a.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-micro bg-muted/20 border-border/20 text-muted-foreground/70"
                    title={a.fileName}
                  >
                    <Paperclip className="w-3 h-3 shrink-0" />
                    <span className="max-w-[160px] truncate">{a.fileName}</span>
                    <span className="shrink-0 text-muted-foreground/50">
                      {formatBytes(a.fileSize)}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action bar */}
        <AnimatePresence>
          {actionsVisible && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: duration.fast }}
              className={cn(
                "flex items-center gap-2 sm:gap-0.5 mt-1.5",
                isUser ? "justify-end" : "justify-start pl-6"
              )}
            >
              <ActionButton icon={copied ? Check : Copy} label="Copy" onClick={handleCopy} active={copied} />
              {!isUser && onRegenerate && (
                <ActionButton icon={RefreshCw} label="Regenerate" onClick={() => onRegenerate(message.id)} />
              )}
              {!isUser && (
                <>
                  <ActionButton
                    icon={ThumbsUp}
                    label={message.feedback === "liked" ? "Undo like" : "Like"}
                    onClick={() => handleFeedback("liked")}
                    active={message.feedback === "liked"}
                  />
                  <ActionButton
                    icon={ThumbsDown}
                    label={message.feedback === "disliked" ? "Undo dislike" : "Dislike"}
                    onClick={() => handleFeedback("disliked")}
                    active={message.feedback === "disliked"}
                  />
                  <ActionButton icon={Bookmark} label={bookmarked ? "Remove bookmark" : "Bookmark"} onClick={toggleBookmark} active={bookmarked} />
                  <ActionButton icon={FileText} label="Metadata" onClick={() => setShowMeta(!showMeta)} />
                </>
              )}
              {isUser && (
                <ActionButton icon={Pencil} label="Edit" onClick={() => setEditing(true)} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={spring.elastic}
          className="shrink-0 mt-1"
        >
          <div className="w-8 h-8 rounded-full bg-muted/60 border border-border/30 flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground/60" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});

function ActionButton({
  icon: Icon, label, onClick, active,
}: {
  icon: React.ElementType; label: string; onClick: () => void; active?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        "h-10 w-10 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        active
          ? "text-primary bg-primary/10"
          : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/30"
      )}
      title={label}
      aria-label={label}
    >
      <motion.span
        key={active ? "on" : "off"}
        initial={{ scale: active ? 0.4 : 1 }}
        animate={{ scale: 1 }}
        transition={spring.elastic}
        className="flex"
      >
        <Icon className="w-3.5 h-3.5" />
      </motion.span>
    </motion.button>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground/60 min-w-[52px]">{label}</span>
      <span className="font-medium text-foreground/80">{value}</span>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
