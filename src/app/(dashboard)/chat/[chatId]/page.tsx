"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/use-chat";
import { PremiumMessageCard } from "@/components/workspace/PremiumMessageCard";
import { PremiumComposer } from "@/components/workspace/PremiumComposer";
import { ExportMenu } from "@/components/workspace/ExportMenu";
import SocialButton from "@/components/ui/effects/SocialButton";
import { AIThinking, GradientPulse } from "@/components/workspace/AIThinking";
import { InlineActionRing } from "@/components/workspace/InlineActionRing";
import { NoConversationEmptyState } from "@/components/workspace/WorkspaceEmptyStates";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { duration, spring } from "@/styles/motion";
import { api } from "@/lib/api-client";
import type { Chat } from "@/types";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  // Selector-based store subscriptions: during streaming only `streamingContent`
  // changes per token, so the page body no longer re-renders on unrelated slices.
  const currentChat = useChatStore((s) => s.currentChat);
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const { sendMessage, stopStreaming, fetchChats, regenerateMessage, continueMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const lastMessageCount = useRef(messages.length);
  const lastContentLength = useRef(0);

  // Cleanup the rAF scroll coalescer on unmount
  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);


  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (!chatId) return;
    // Optimistic temp chats are created locally — no server row yet. If the
    // background creation failed and the store has no chat, fall back to the
    // chat index instead of sitting on a skeleton forever.
    if (chatId.startsWith("temp-")) {
      if (!useChatStore.getState().currentChat) {
        router.replace("/chat");
      }
      return;
    }
    api<Chat>(`/api/chats/${chatId}`)
      .then((data) => {
        useChatStore.getState().setCurrentChat(data);
      })
      .catch(() => {
        router.push("/chat");
      });
  }, [chatId, router]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(nearBottom);
  }, []);

  // Smart auto-scroll: always for the first message of a run, then only if the user is near the bottom.
  // Per-token scroll writes are coalesced to one per animation frame to avoid forced layout thrash.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (messages.length !== lastMessageCount.current) {
      // a message arrived (send or final stream) — jump to bottom
      el.scrollTop = el.scrollHeight;
      lastMessageCount.current = messages.length;
      setAtBottom(true);
    } else if (atBottom && streamingContent.length !== lastContentLength.current) {
      // streaming tokens — keep the user pinned only if they were already at the bottom,
      // coalescing writes to one per frame
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const target = scrollRef.current;
          if (target) target.scrollTop = target.scrollHeight;
        });
      }
    }
    lastContentLength.current = streamingContent.length;
  }, [messages, streamingContent, atBottom]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    if (chatId.startsWith("temp-")) return;
    try {
      await regenerateMessage(messageId);
      const chat = await api<Chat>(`/api/chats/${chatId}`);
      useChatStore.getState().setMessages(chat.messages ?? []);
    } catch {
      toast.error("Failed to regenerate");
    }
  }, [chatId, regenerateMessage]);

  const handleContinue = useCallback(async (messageId: string) => {
    if (chatId.startsWith("temp-")) return;
    try {
      await continueMessage(messageId);
      const chat = await api<Chat>(`/api/chats/${chatId}`);
      useChatStore.getState().setMessages(chat.messages ?? []);
    } catch {
      toast.error("Failed to continue");
    }
  }, [chatId, continueMessage]);

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-3 w-full max-w-md px-6">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-3/4 rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full relative">
      <InlineActionRing containerRef={containerRef} />

      {/* Chat header */}
      <div className="shrink-0 h-12 flex items-center justify-between px-4 border-b border-border/20 bg-background/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[15px] font-display tracking-tight truncate">{currentChat.title || "Chat"}</span>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu chatId={chatId} align="right" />
          <SocialButton
            label="Share"
            onShare={(_, item) => {
              if (item.label === "Copy link") {
                navigator.clipboard.writeText(`${window.location.origin}/chat/${chatId}`);
                toast.success("Link copied to clipboard");
              } else {
                const urls: Record<string, string> = {
                  Twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/chat/${chatId}`)}&text=Check out this chat`,
                  Instagram: "https://www.instagram.com/",
                  LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/chat/${chatId}`)}`,
                };
                const url = urls[item.label.replace("Share on ", "")];
                if (url) window.open(url, "_blank", "noopener,noreferrer");
              }
            }}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto scrollbar-thin relative">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 && !isLoading && (
              <NoConversationEmptyState />
            )}

            {messages.map((message, index) => (
              <PremiumMessageCard
                key={message.id}
                message={message}
                isLastMessage={index === messages.length - 1}
                onRegenerate={message.role === "assistant" ? handleRegenerate : undefined}
                onContinue={message.role === "assistant" ? handleContinue : undefined}
              />
            ))}
          </AnimatePresence>

          {/* Streaming message */}
          <AnimatePresence>
            {isLoading && streamingContent && (
              <PremiumMessageCard
                message={{
                  id: "streaming",
                  chatId,
                  role: "assistant",
                  content: streamingContent,
                  tone: useChatStore.getState().selectedTone,
                  tokens: null, latency: null, model: null,
                  isEdited: false, editedAt: null, feedback: null, parentId: null,
                  createdAt: new Date(),
                  attachments: [],
                }}
                isStreaming
              />
            )}
          </AnimatePresence>

          {/* AI Thinking indicator */}
          <AnimatePresence>
            {isLoading && !streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: duration.normal }}
              >
                <AIThinking phase={messages.length % 4} />
                <div className="px-6 pb-2 max-w-4xl mx-auto">
                  <GradientPulse />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-4" />
        </div>
      </div>

      {/* Composer */}
      <PremiumComposer chatId={chatId} onSend={sendMessage} onStop={stopStreaming} />

      {/* Scroll-to-bottom floating button */}
      <AnimatePresence>
        {!atBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={spring.snappy}
            onClick={scrollToBottom}
            aria-label="Scroll to latest messages"
            className="absolute bottom-4 right-4 h-9 w-9 rounded-full bg-background border border-border/40 shadow-premium flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/70 transition-colors z-10"
          >
            <ArrowDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
