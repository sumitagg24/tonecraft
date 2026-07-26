"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import {
  User, Bot, Copy, ThumbsUp, ThumbsDown, RefreshCw,
  Check, Pencil, X, FileText, MoreHorizontal, Play,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TONES } from "@/lib/constants";
import { useChat } from "@/hooks/use-chat";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { messageVariants, avatar, loading, spring, ease, duration } from "@/styles/motion";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: (messageId: string) => void;
  onContinue?: (messageId: string) => void;
}

export function ChatMessage({ message, isStreaming, onRegenerate, onContinue }: ChatMessageProps) {
  const isUser = message.role === "user";
  const tone = message.tone ? TONES.find((t) => t.id === message.tone) : null;
  const { setMessageFeedback } = useChat();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showMeta, setShowMeta] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  const handleFeedback = async (feedback: "liked" | "disliked") => {
    const newFeedback = message.feedback === feedback ? null : feedback;
    await setMessageFeedback(message.id, newFeedback);
    toast.success(newFeedback ? `${feedback === "liked" ? "Liked" : "Disliked"} response` : "Feedback removed");
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error("Failed to edit");
      setEditing(false);
      toast.success("Message updated");
    } catch {
      toast.error("Failed to update message");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <motion.div
      variants={messageVariants.incoming}
      initial="initial"
      animate="animate"
      transition={{ duration: duration.normal, ease: ease.emphasized }}
      className={cn("flex gap-4 px-6 py-5 max-w-4xl mx-auto w-full", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={avatar}
          className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow"
        >
          <Bot className="w-5 h-5 text-white" />
        </motion.div>
      )}

      <motion.div
        variants={messageVariants.outgoing}
        initial="initial"
        animate="animate"
        transition={{ duration: duration.fast, ease: "easeOut" }}
        className={cn(
          "max-w-[85%] rounded-2xl px-5 py-4 transition-all duration-300",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm shadow-glow"
            : "bg-card border border-border/40 rounded-bl-sm shadow-card hover:border-white/10"
        )}
      >
        {isUser ? (
          editing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-muted/20 border border-border/40 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSaveEdit} disabled={savingEdit}>
                  {savingEdit ? <Bot className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => { setEditing(false); setEditContent(message.content); }}>
                  <X className="w-3 h-3" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              {message.isEdited && (
                <span className="text-[10px] opacity-60 mt-1 block">(edited)</span>
              )}
            </div>
          )
        ) : (
          <>
            {!isStreaming && (
              <div className="flex items-center gap-2 mb-3">
                {tone && (
                  <Badge variant="outline" className="text-[10px] py-0.5 h-4 border-border/40"
                    style={{ color: tone.color, borderColor: `${tone.color}40` }}
                  >
                    {tone.emoji} {tone.label}
                  </Badge>
                )}
                <button onClick={() => setShowMeta(!showMeta)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  <MoreHorizontal className="w-3 h-3" />
                </button>
              </div>
            )}

            {showMeta && !isStreaming && (
              <motion.div
                variants={{ initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: "auto" } }}
                initial="initial" animate="animate"
                transition={{ duration: duration.fast }}
                className="mb-3 p-2 rounded-lg bg-muted/30 text-[10px] text-muted-foreground space-y-1"
              >
                {message.model && <p>Model: {message.model}</p>}
                {message.tokens && <p>Tokens: {message.tokens}</p>}
                {message.latency && <p>Latency: {(message.latency / 1000).toFixed(1)}s</p>}
                {message.platform && <p>Platform: {message.platform}</p>}
                {message.createdAt && <p>Time: {new Date(message.createdAt).toLocaleTimeString()}</p>}
              </motion.div>
            )}

            <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  pre: ({ children }) => (
                    <pre className="bg-muted rounded-lg p-3 overflow-x-auto my-2 group relative">
                      <button
                        onClick={() => handleCopyCode((children as any)?.props?.children || "")}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-background/80 hover:bg-background transition-all"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {children}
                    </pre>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                      return <code className="bg-muted/80 px-1.5 py-0.5 rounded text-[0.85em] font-mono" {...props}>{children}</code>;
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                    >{children}</a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {isStreaming && (
              <motion.span
                {...loading.pulse}
                className="inline-block w-2 h-4 ml-1 bg-primary align-middle rounded-sm"
              />
            )}

            {!isStreaming && (
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/30">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        onClick={handleCopy}>
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon"
                        className={cn("h-7 w-7 hover:bg-muted/50", message.feedback === "liked" ? "text-green-500" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => handleFeedback("liked")}>
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Like</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon"
                        className={cn("h-7 w-7 hover:bg-muted/50", message.feedback === "disliked" ? "text-red-500" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => handleFeedback("disliked")}>
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Dislike</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="w-px h-5 bg-border/40 mx-1" />

                {onRegenerate && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          onClick={() => onRegenerate(message.id)}>
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Regenerate</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {onContinue && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          onClick={() => onContinue(message.id)}>
                          <Play className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Continue</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <div className="flex-1" />

                {!isUser && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          onClick={() => setShowMeta(!showMeta)}>
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Metadata</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </>
        )}

        {isUser && !editing && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex-1" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"
                    className="h-7 w-7 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => setEditing(true)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"
                    className="h-7 w-7 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={handleCopy}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {isStreaming && !isUser && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
            <motion.div {...loading.spin}>
              <Bot className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-xs text-muted-foreground">AI is writing...</span>
          </div>
        )}
      </motion.div>

      {isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={avatar}
          className="flex-shrink-0 w-9 h-9 rounded-xl bg-muted flex items-center justify-center border border-border/40"
        >
          <User className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      )}
    </motion.div>
  );
}
