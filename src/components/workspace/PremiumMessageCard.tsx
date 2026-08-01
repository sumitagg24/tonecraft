"use client";
import { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { TONES } from "@/lib/constants";
import { PremiumBadge } from "@/components/ui/recipes/PremiumBadge";
import { User, Bot, Copy, MoreHorizontal, Check, RefreshCw, Play, ThumbsUp, ThumbsDown, Bookmark, FileText, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { toast } from "sonner";
import { messageVariants, spring, ease, duration } from "@/styles/motion";
import { GenerationComplete } from "./AIThinking";

interface PremiumMessageCardProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: (messageId: string) => void;
  onContinue?: (messageId: string) => void;
}

export const PremiumMessageCard = memo(function PremiumMessageCard({
  message, isStreaming, onRegenerate, onContinue,
}: PremiumMessageCardProps) {
  const isUser = message.role === "user";
  const tone = message.tone ? TONES.find((t) => t.id === message.tone) : null;
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showMeta, setShowMeta] = useState(false);

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

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div
      variants={isUser ? messageVariants.outgoing : messageVariants.incoming}
      initial="initial"
      animate="animate"
      transition={{ duration: duration.normal, ease: ease.emphasized }}
      className={cn(
        "flex gap-3 px-6 py-4 max-w-4xl mx-auto w-full group",
        isUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={spring.elastic}
          className="relative shrink-0 mt-1"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 blur-sm -z-10"
          />
        </motion.div>
      )}

      <div className={cn(
        "relative max-w-[80%] min-w-0",
        isUser ? "order-1" : "order-1"
      )}>
        {/* Message Card */}
        <div
          className={cn(
            "rounded-2xl px-5 py-4 transition-all duration-200 relative",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-sm shadow-glow"
              : "bg-card/60 backdrop-blur-sm border border-border/30 rounded-bl-sm shadow-card hover:border-border/50"
          )}
        >
          {/* Tone badge for AI messages */}
          {!isUser && !isStreaming && tone && (
            <div className="flex items-center gap-2 mb-2.5">
              <PremiumBadge variant="tone" className="border-border/40 text-[10px] py-0.5 h-5">
                <span className="text-xs">{tone.emoji}</span>
                {tone.label}
              </PremiumBadge>
              <button
                onClick={() => setShowMeta(!showMeta)}
                className="text-muted-foreground/40 hover:text-foreground/60 transition-colors"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Metadata panel */}
          <AnimatePresence>
            {showMeta && !isStreaming && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: duration.fast }}
                className="mb-3 p-2.5 rounded-xl bg-muted/40 border border-border/20 text-[10px] text-muted-foreground space-y-1 overflow-hidden"
              >
                {message.model && <MetaRow label="Model" value={message.model} />}
                {message.tokens && <MetaRow label="Tokens" value={message.tokens.toLocaleString()} />}
                {message.latency && <MetaRow label="Latency" value={`${(message.latency / 1000).toFixed(1)}s`} />}
                {message.platform && <MetaRow label="Platform" value={message.platform} />}
                <MetaRow label="Time" value={formatTime(message.createdAt)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* User message content */}
          {isUser ? (
            <div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground/90">
                {message.content}
              </p>
              {message.isEdited && (
                <span className="text-[10px] text-primary-foreground/50 mt-1.5 block">(edited)</span>
              )}
              <div className="flex items-center gap-1 mt-2 text-primary-foreground/50">
                <span className="text-[10px]">{formatTime(message.createdAt)}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Assistant message content */}
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
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
                          className="absolute top-2.5 right-2.5 opacity-0 group-hover/pre:opacity-100 p-1.5 rounded-lg bg-background/60 hover:bg-background/80 border border-border/20 transition-all"
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
                      <ul className="list-disc list-outside space-y-1 my-2 ml-4">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-outside space-y-1 my-2 ml-4">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm leading-relaxed marker:text-muted-foreground/40">{children}</li>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>

              {/* Streaming cursor */}
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="inline-block w-[2px] h-[1em] bg-primary align-text-bottom ml-0.5"
                />
              )}

              {/* Timestamp */}
              {!isStreaming && (
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-muted-foreground/40">
                    {formatTime(message.createdAt)}
                  </span>
                  {message.tokens && (
                    <span className="text-[9px] text-muted-foreground/30">
                      {message.tokens} tokens
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Gradient border glow for AI messages */}
        {!isUser && !isStreaming && (
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10 -z-10 blur-[2px]" />
        )}

        {/* Action Bar (appears on hover) */}
        <AnimatePresence>
          {showActions && !isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: duration.fast }}
              className={cn(
                "flex items-center gap-0.5 mt-1.5",
                isUser ? "justify-end" : "justify-start"
              )}
            >
              <ActionButton icon={copied ? Check : Copy} label="Copy" onClick={handleCopy} active={copied} />
              {!isUser && onRegenerate && (
                <ActionButton icon={RefreshCw} label="Regenerate" onClick={() => onRegenerate(message.id)} />
              )}
              {!isUser && onContinue && (
                <ActionButton icon={Play} label="Continue" onClick={() => onContinue(message.id)} />
              )}
              {!isUser && (
                <>
                  <ActionButton
                    icon={ThumbsUp}
                    label="Like"
                    onClick={() => toast.success("Liked")}
                    active={message.feedback === "liked"}
                  />
                  <ActionButton
                    icon={ThumbsDown}
                    label="Dislike"
                    onClick={() => toast.success("Feedback sent")}
                    active={message.feedback === "disliked"}
                  />
                  <ActionButton
                    icon={Bookmark}
                    label="Bookmark"
                    onClick={() => { setBookmarked(!bookmarked); toast.success(bookmarked ? "Removed bookmark" : "Bookmarked"); }}
                    active={bookmarked}
                  />
                  <ActionButton icon={FileText} label="Metadata" onClick={() => setShowMeta(!showMeta)} />
                </>
              )}
              {isUser && (
                <ActionButton icon={Pencil} label="Edit" onClick={() => toast.success("Edit mode")} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generation complete indicator */}
        {!isUser && !isStreaming && message.tokens && (
          <GenerationComplete />
        )}
      </div>

      {isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={spring.elastic}
          className="shrink-0 mt-1"
        >
          <div className="w-9 h-9 rounded-xl bg-muted/60 border border-border/30 flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground/60" />
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
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "h-7 w-7 rounded-lg flex items-center justify-center transition-all",
        active
          ? "text-primary bg-primary/10"
          : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/30"
      )}
      title={label}
      aria-label={label}
    >
      <Icon className="w-3.5 h-3.5" />
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
