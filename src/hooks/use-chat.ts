import { useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import type { Chat, Message } from "@/types";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

let activeController: AbortController | null = null;

// Error codes that indicate the user has hit a free-tier limit and needs to upgrade.
const FREE_TIER_LIMIT_ERRORS = new Set([
  "RATE_LIMITED",
  "INSUFFICIENT_CREDITS",
  "CREDIT_LIMIT_EXCEEDED",
]);

interface LimitErrorShape {
  code?: string;
  details?: { limit?: number; window?: string };
  message?: string;
}

function isLimitError(err: unknown): LimitErrorShape | null {
  if (!err || typeof err !== "object") return null;
  const e = err as { error?: { code?: string }; message?: string };
  if (e.error?.code && FREE_TIER_LIMIT_ERRORS.has(e.error.code)) return e.error;
  if (typeof e.message === "string" && e.message.includes("Insufficient credits")) return { code: "INSUFFICIENT_CREDITS", message: e.message };
  return null;
}

export function useChat() {
  const sendMessage = useCallback(
    async (content: string, chatId: string, opts?: { knowledgeFileIds?: string[] }) => {
      const { selectedTone, selectedModel, selectedPersona, setIsLoading, clearStreamingContent, addMessage, appendStreamingContent, setMessages, context } = useChatStore.getState();
      setIsLoading(true);
      clearStreamingContent();

      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId,
        role: "user",
        content,
        tone: selectedTone,
        tokens: null,
        latency: null,
        model: null,
        isEdited: false,
        editedAt: null,
        feedback: null,
        parentId: null,
        createdAt: new Date(),
        attachments: [],
      };
      addMessage(tempUserMessage);

      const controller = new AbortController();
      activeController = controller;

      try {
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ content, tone: selectedTone, model: selectedModel, personaId: selectedPersona, knowledgeFileIds: opts?.knowledgeFileIds, ...context }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err?.error?.message || "Failed to send message");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        if (!reader) throw new Error("No response body");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "token") {
                  appendStreamingContent(data.content);
                } else if (data.type === "error") {
                  throw new Error(data.message);
                }
              } catch { /* ignore parse errors */ }
            }
          }
        }

        const chat = await api<Chat>(`/api/chats/${chatId}`);
        setMessages(chat.messages ?? []);
        clearStreamingContent();
      } catch (error) {
        if (controller.signal.aborted) {
          // user stopped: pull the partial response the server saved.
          // retry briefly in case the server's save hasn't landed yet.
          for (let attempt = 0; attempt < 3; attempt++) {
            await new Promise((r) => setTimeout(r, 250));
            try {
              const chat = await api<Chat>(`/api/chats/${chatId}`);
              const lastAssistant = [...(chat.messages ?? [])].reverse().find((m) => m.role === "assistant");
              if (lastAssistant && lastAssistant.content) {
                setMessages(chat.messages ?? []);
                break;
              }
            } catch {
              /* ignore */
            }
          }
          clearStreamingContent();
        } else {
          const err = error as Error;
          const limitErr = isLimitError(err);
          if (limitErr) {
            const isCredit = limitErr.code === "INSUFFICIENT_CREDITS";
            toast.error(
              isCredit ? "Credits exhausted" : "Rate limit reached",
              {
                description: isCredit
                  ? "You've hit your free tier limit. Upgrade for unlimited."
                  : `Rate limit: ${limitErr.details?.limit ?? "?"} per ${limitErr.details?.window ?? "hour"}.`,
                action: {
                  label: "Upgrade",
                  onClick: () => {
                    window.location.href = "/billing";
                  },
                },
                duration: 8000,
              }
            );
          } else {
            console.error("Chat error:", error);
            toast.error(err?.message || "Failed to send message");
          }
        }
      } finally {
        if (activeController === controller) activeController = null;
        setIsLoading(false);
      }
    },
    []
  );

  const stopStreaming = useCallback(() => {
    activeController?.abort();
  }, []);

  const createChat = useCallback(async (data?: { title?: string; tone?: string }) => {
    return api<Chat>("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const chats = await api<Chat[]>("/api/chats");
      useChatStore.getState().setChats(chats);
    } catch {
      // keep current behavior: sidebar stays empty on failure
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      await api(`/api/chats/${chatId}`, { method: "DELETE" });
    } catch {
      toast.error("Failed to delete chat");
      return;
    }
    const { chats, currentChat, setChats, setCurrentChat, setMessages } = useChatStore.getState();
    setChats(chats.filter((c) => c.id !== chatId));
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
      setMessages([]);
    }
  }, []);

  const renameChat = useCallback(async (chatId: string, title: string) => {
    try {
      await api(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    } catch {
      toast.error("Failed to rename chat");
      return;
    }
    useChatStore.getState().updateChatInList(chatId, { title });
  }, []);

  const togglePin = useCallback(async (chatId: string, pinned: boolean) => {
    try {
      await api(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: pinned }),
      });
    } catch {
      toast.error("Failed to update pin");
      return;
    }
    useChatStore.getState().updateChatInList(chatId, { isPinned: pinned });
  }, []);

  const toggleFavorite = useCallback(async (chatId: string, favorite: boolean) => {
    try {
      await api(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: favorite }),
      });
    } catch {
      toast.error("Failed to update favorite");
      return;
    }
    useChatStore.getState().updateChatInList(chatId, { isFavorite: favorite });
  }, []);

  const archiveChat = useCallback(async (chatId: string, archived: boolean) => {
    try {
      await api(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: archived }),
      });
    } catch {
      toast.error("Failed to archive chat");
      return;
    }
    useChatStore.getState().updateChatInList(chatId, { isArchived: archived });
  }, []);

  const regenerateMessage = useCallback(async (messageId: string) => {
    return api<Message>(`/api/messages/${messageId}/regenerate`, { method: "POST" });
  }, []);

  const continueMessage = useCallback(async (messageId: string) => {
    return api<Message>(`/api/messages/${messageId}/continue`, { method: "POST" });
  }, []);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await api(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } catch {
      throw new Error("Failed to edit");
    }
    useChatStore.getState().updateMessage(messageId, content);
  }, []);

  const setMessageFeedback = useCallback(async (messageId: string, feedback: "liked" | "disliked" | null) => {
    try {
      await api(`/api/messages/${messageId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
    } catch {
      toast.error("Failed to save feedback");
    }
  }, []);

  return {
    sendMessage, stopStreaming, createChat, fetchChats, deleteChat,
    renameChat, togglePin, toggleFavorite, archiveChat,
    regenerateMessage, continueMessage, editMessage, setMessageFeedback,
  };
}
