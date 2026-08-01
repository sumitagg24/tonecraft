"use client";
import { useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/use-chat";
import { PremiumMessageCard } from "@/components/workspace/PremiumMessageCard";
import { PremiumComposer } from "@/components/workspace/PremiumComposer";
import { AIThinking, GradientPulse } from "@/components/workspace/AIThinking";
import { InlineActionRing } from "@/components/workspace/InlineActionRing";
import { NoConversationEmptyState } from "@/components/workspace/WorkspaceEmptyStates";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { duration } from "@/styles/motion";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const { currentChat, messages, isLoading, streamingContent } = useChatStore();
  const { sendMessage, stopStreaming, fetchChats, regenerateMessage, continueMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (!chatId) return;
    fetch(`/api/chats/${chatId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        useChatStore.getState().setCurrentChat(data);
      })
      .catch(() => {
        router.push("/chat");
      });
  }, [chatId, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    try {
      await regenerateMessage(messageId);
      const res = await fetch(`/api/chats/${chatId}`);
      if (res.ok) {
        const chat = await res.json();
        useChatStore.getState().setMessages(chat.messages);
      }
    } catch {
      toast.error("Failed to regenerate");
    }
  }, [chatId, regenerateMessage]);

  const handleContinue = useCallback(async (messageId: string) => {
    try {
      await continueMessage(messageId);
      const res = await fetch(`/api/chats/${chatId}`);
      if (res.ok) {
        const chat = await res.json();
        useChatStore.getState().setMessages(chat.messages);
      }
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

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
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
    </div>
  );
}
