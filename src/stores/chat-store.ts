import { create } from "zustand";
import type { Chat, Message } from "@/types";

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  selectedTone: string;
  selectedModel: string;
  selectedPersona: string | null;
  searchQuery: string;
  searchResults: { chats: Chat[]; messages: Pick<Message, "id" | "content" | "chatId" | "role" | "createdAt">[] };
  context: {
    platform: string;
    language: string;
    recipient: string;
    length: "short" | "medium" | "long";
    creativity: number;
    emojis: boolean;
    audience: string;
    formality: "casual" | "neutral" | "formal";
  };

  setChats: (chats: Chat[]) => void;
  setCurrentChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, content: string) => void;
  updateMessageInList: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
  appendStreamingContent: (content: string) => void;
  clearStreamingContent: () => void;
  setSelectedTone: (tone: string) => void;
  setSelectedModel: (model: string) => void;
  setSelectedPersona: (persona: string | null) => void;
  setContext: (context: Partial<ChatState["context"]>) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: ChatState["searchResults"]) => void;
  updateChatInList: (chatId: string, updates: Partial<Chat>) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  streamingContent: "",
  selectedTone: "professional",
  selectedModel: "auto",
  selectedPersona: null,
  searchQuery: "",
  searchResults: { chats: [], messages: [] },
  context: {
    platform: "email",
    language: "en",
    recipient: "",
    length: "medium",
    creativity: 70,
    emojis: true,
    audience: "",
    formality: "neutral",
  },

  setChats: (chats) => set({ chats }),
  setCurrentChat: (chat) => set({ currentChat: chat, messages: chat?.messages || [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) => m.id === id ? { ...m, content, isEdited: true, editedAt: new Date() } : m),
    })),
  updateMessageInList: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  removeMessage: (id) =>
    set((state) => ({ messages: state.messages.filter((m) => m.id !== id) })),
  setIsLoading: (isLoading) => set({ isLoading }),
  appendStreamingContent: (content) =>
    set((state) => ({ streamingContent: state.streamingContent + content })),
  clearStreamingContent: () => set({ streamingContent: "" }),
  setSelectedTone: (tone) => set({ selectedTone: tone }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedPersona: (persona) => set({ selectedPersona: persona }),
  setContext: (ctx) => set((state) => ({ context: { ...state.context, ...ctx } })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  updateChatInList: (chatId, updates) =>
    set((state) => ({
      chats: state.chats.map((c) => c.id === chatId ? { ...c, ...updates } : c),
      currentChat: state.currentChat?.id === chatId ? { ...state.currentChat, ...updates } : state.currentChat,
    })),
}));
