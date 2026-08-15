import { useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import type { Chat, Message } from "@/types";
import { api } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

let activeController: AbortController | null = null;

/**
 * Pending optimistic chat creations keyed by temp id. When a message is sent
 * to a temp chat before the server row exists, sendMessage awaits the real
 * chat so the POST targets the persisted id instead of 404ing.
 */
const pendingChatCreations = new Map<string, Promise<Chat | null>>();

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

      // If this is an optimistic temp chat whose server row is still being
      // created, wait for it so the message POST lands on a real chat id.
      let targetChatId = chatId;
      if (chatId.startsWith("temp-")) {
        const pending = pendingChatCreations.get(chatId);
        if (pending) {
          const real = await pending;
          if (real) targetChatId = real.id;
        }
      }

      setIsLoading(true);
      clearStreamingContent();

      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId: targetChatId,
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
        const response = await fetch(`/api/chats/${targetChatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ content, tone: selectedTone, model: selectedModel, personaId: selectedPersona, knowledgeFileIds: opts?.knowledgeFileIds, ...context }),
        });

        if (!response.ok) {
          const err = await response.json();
          // Preserve the error code so isLimitError() can recognize RATE_LIMITED /
          // INSUFFICIENT_CREDITS and surface the upgrade toast instead of a raw
          // console.error + generic toast.
          const code = err?.error?.code as string | undefined;
          const message = err?.error?.message || "Failed to send message";
          const e = new Error(message) as Error & { error?: { code?: string } };
          if (code) e.error = { code };
          throw e;
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
            if (!line.startsWith("data: ")) continue;
            // Parse and dispatch are separate: a `catch` around both swallowed
            // the server's own `error` events along with parse failures.
            let data: { type?: string; content?: string; message?: string };
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              logger.warn("[chat] skipped malformed SSE frame");
              continue;
            }
            if (data.type === "token") {
              appendStreamingContent(data.content ?? "");
            } else if (data.type === "error") {
              throw new Error(data.message || "Failed to generate response");
            }
          }
        }

        const chat = await api<Chat>(`/api/chats/${targetChatId}`);
        setMessages(chat.messages ?? []);
        clearStreamingContent();
      } catch (error) {
        if (controller.signal.aborted) {
          // user stopped: pull the partial response the server saved.
          // retry briefly in case the server's save hasn't landed yet.
          for (let attempt = 0; attempt < 3; attempt++) {
            await new Promise((r) => setTimeout(r, 250));
            try {
              const chat = await api<Chat>(`/api/chats/${targetChatId}`);
              const lastAssistant = [...(chat.messages ?? [])].reverse().find((m) => m.role === "assistant");
              if (lastAssistant && lastAssistant.content) {
                setMessages(chat.messages ?? []);
                break;
              }
            } catch (refetchError) {
              logger.warn("[chat] partial-response refetch failed", {
                chatId: targetChatId,
                attempt,
                error: refetchError instanceof Error ? refetchError.message : String(refetchError),
              });
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

  /**
   * Optimistic New Chat: returns a temp chat id instantly so the UI can
   * navigate without waiting for the network round-trip, then swaps in the
   * server-created chat (and tells the caller the real id via onReady).
   */
  const createChatOptimistic = useCallback(async (data?: { title?: string; tone?: string } | ((real: Chat) => void), onReady?: (real: Chat) => void) => {
    const tempId = `temp-${Date.now()}`;
    const { selectedTone, setCurrentChat } = useChatStore.getState();
    // Allow both call styles: (onReady) and ({ title }, onReady).
    const isOptions = typeof data === "object" && data !== null;
    const ready = isOptions ? onReady : (data as ((real: Chat) => void) | undefined);
    const options = isOptions ? (data as { title?: string; tone?: string }) : undefined;
    const tempChat: Chat = {
      id: tempId,
      userId: "",
      title: options?.title || "New Chat",
      tone: options?.tone || selectedTone,
      model: "auto",
      messages: [],
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentChat(tempChat);
    // Fire the real creation in the background; swap ids when it lands.
    const pending = createChat(options).then((real) => {
      pendingChatCreations.delete(tempId);
      useChatStore.getState().resolveTempChat(tempId, real);
      // Only hand off navigation if the user is still on this temp chat —
      // otherwise they've moved on and shouldn't be yanked back.
      if (useChatStore.getState().currentChat?.id === tempId) {
        ready?.(real);
      }
      return real;
    }).catch(() => {
      pendingChatCreations.delete(tempId);
      // If creation failed, drop the temp chat so the UI falls back to the
      // empty state instead of showing a phantom chat.
      const { currentChat, setCurrentChat: setC } = useChatStore.getState();
      if (currentChat?.id === tempId) setC(null);
      toast.error("Failed to create chat");
      return null;
    });
    pendingChatCreations.set(tempId, pending);
    return tempId;
  }, [createChat]);

  const fetchChats = useCallback(async () => {
    try {
      const chats = await api<Chat[]>("/api/chats");
      useChatStore.getState().setChats(chats);
    } catch (error) {
      logger.error(
        "[chat] failed to load chat list",
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error("Failed to load your chats");
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
    sendMessage, stopStreaming, createChat, createChatOptimistic, fetchChats, deleteChat,
    renameChat, togglePin, toggleFavorite, archiveChat,
    regenerateMessage, editMessage, setMessageFeedback,
  };
}
