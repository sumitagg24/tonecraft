import { useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import type { Message } from "@/types";
import { toast } from "sonner";

let activeController: AbortController | null = null;

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
          const error = await response.json();
          throw new Error(error.error || "Failed to send message");
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

        const refreshRes = await fetch(`/api/chats/${chatId}`);
        if (!refreshRes.ok) throw new Error("Failed to refresh chat");
        const chat = await refreshRes.json();
        setMessages(chat.messages);
        clearStreamingContent();
      } catch (error) {
        if (controller.signal.aborted) {
          // user stopped: pull the partial response the server saved.
          // retry briefly in case the server's save hasn't landed yet.
          for (let attempt = 0; attempt < 3; attempt++) {
            await new Promise((r) => setTimeout(r, 250));
            try {
              const refreshRes = await fetch(`/api/chats/${chatId}`);
              if (!refreshRes.ok) continue;
              const chat = await refreshRes.json();
              const lastAssistant = [...chat.messages].reverse().find((m) => m.role === "assistant");
              if (lastAssistant && lastAssistant.content) {
                setMessages(chat.messages);
                break;
              }
            } catch {
              /* ignore */
            }
          }
          clearStreamingContent();
        } else {
          console.error("Chat error:", error);
          toast.error(error instanceof Error ? error.message : "Failed to send message");
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
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) throw new Error("Failed to create chat");
    return res.json();
  }, []);

  const fetchChats = useCallback(async () => {
    const res = await fetch("/api/chats");
    if (res.ok) {
      const chats = await res.json();
      useChatStore.getState().setChats(chats);
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete chat"); return; }
    const { chats, currentChat, setChats, setCurrentChat, setMessages } = useChatStore.getState();
    setChats(chats.filter((c) => c.id !== chatId));
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
      setMessages([]);
    }
  }, []);

  const renameChat = useCallback(async (chatId: string, title: string) => {
    const res = await fetch(`/api/chats/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) { toast.error("Failed to rename chat"); return; }
    useChatStore.getState().updateChatInList(chatId, { title });
  }, []);

  const togglePin = useCallback(async (chatId: string, pinned: boolean) => {
    const res = await fetch(`/api/chats/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: pinned }),
    });
    if (!res.ok) { toast.error("Failed to update pin"); return; }
    useChatStore.getState().updateChatInList(chatId, { isPinned: pinned });
  }, []);

  const toggleFavorite = useCallback(async (chatId: string, favorite: boolean) => {
    const res = await fetch(`/api/chats/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: favorite }),
    });
    if (!res.ok) { toast.error("Failed to update favorite"); return; }
    useChatStore.getState().updateChatInList(chatId, { isFavorite: favorite });
  }, []);

  const archiveChat = useCallback(async (chatId: string, archived: boolean) => {
    const res = await fetch(`/api/chats/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: archived }),
    });
    if (!res.ok) { toast.error("Failed to archive chat"); return; }
    useChatStore.getState().updateChatInList(chatId, { isArchived: archived });
  }, []);

  const regenerateMessage = useCallback(async (messageId: string) => {
    const res = await fetch(`/api/messages/${messageId}/regenerate`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to regenerate");
    return res.json();
  }, []);

  const continueMessage = useCallback(async (messageId: string) => {
    const res = await fetch(`/api/messages/${messageId}/continue`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to continue");
    return res.json();
  }, []);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("Failed to edit");
    useChatStore.getState().updateMessage(messageId, content);
  }, []);

  const setMessageFeedback = useCallback(async (messageId: string, feedback: "liked" | "disliked" | null) => {
    const res = await fetch(`/api/messages/${messageId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback }),
    });
    if (!res.ok) toast.error("Failed to save feedback");
  }, []);

  return {
    sendMessage, stopStreaming, createChat, fetchChats, deleteChat,
    renameChat, togglePin, toggleFavorite, archiveChat,
    regenerateMessage, continueMessage, editMessage, setMessageFeedback,
  };
}
