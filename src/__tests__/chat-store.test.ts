import { describe, it, expect, beforeEach } from "@jest/globals";
import { useChatStore } from "@/stores/chat-store";
import type { Chat } from "@/types";

function makeChat(overrides: Partial<Chat> = {}): Chat {
  return {
    id: "chat-1",
    userId: "user-1",
    title: "Test Chat",
    model: "auto",
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [],
    ...overrides,
  };
}

describe("chat-store optimistic chat flow", () => {
  beforeEach(() => {
    const { setChats, setCurrentChat, setMessages } = useChatStore.getState();
    setChats([]);
    setCurrentChat(null);
    setMessages([]);
  });

  it("resolveTempChat swaps a temp chat for the server chat in the list", () => {
    const temp = makeChat({ id: "temp-123", title: "New Chat" });
    const real = makeChat({ id: "chat-real-1", title: "New Chat" });

    const { setChats, setCurrentChat } = useChatStore.getState();
    setChats([temp]);
    setCurrentChat(temp);

    useChatStore.getState().resolveTempChat("temp-123", real);

    const state = useChatStore.getState();
    expect(state.chats).toHaveLength(1);
    expect(state.chats[0].id).toBe("chat-real-1");
    expect(state.chats[0]).toEqual(real);
  });

  it("resolveTempChat updates currentChat and messages when the user is on the temp chat", () => {
    const temp = makeChat({ id: "temp-1" });
    const real = makeChat({
      id: "chat-real-2",
      messages: [
        {
          id: "m1",
          chatId: "chat-real-2",
          role: "assistant",
          content: "Hello",
          tone: null,
          tokens: null,
          latency: null,
          model: null,
          isEdited: false,
          editedAt: null,
          feedback: null,
          parentId: null,
          createdAt: new Date(),
          attachments: [],
        },
      ],
    });

    const { setChats, setCurrentChat } = useChatStore.getState();
    setChats([temp]);
    setCurrentChat(temp);

    useChatStore.getState().resolveTempChat("temp-1", real);

    const state = useChatStore.getState();
    expect(state.currentChat?.id).toBe("chat-real-2");
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].content).toBe("Hello");
  });

  it("resolveTempChat prepends the real chat when the temp chat is not in the list", () => {
    const existing = makeChat({ id: "chat-a" });
    const real = makeChat({ id: "chat-real-3" });

    const { setChats } = useChatStore.getState();
    setChats([existing]);
    useChatStore.getState().resolveTempChat("temp-ghost", real);

    const state = useChatStore.getState();
    expect(state.chats).toHaveLength(2);
    expect(state.chats[0].id).toBe("chat-real-3");
  });

  it("does not clobber messages when the user navigated away from the temp chat", () => {
    const temp = makeChat({ id: "temp-9" });
    const real = makeChat({ id: "chat-real-9", messages: [] });
    const other = makeChat({ id: "chat-b", messages: [] });

    const { setChats, setCurrentChat } = useChatStore.getState();
    setChats([temp, other]);
    setCurrentChat(other); // user moved on to another chat

    useChatStore.getState().resolveTempChat("temp-9", real);

    const state = useChatStore.getState();
    expect(state.currentChat?.id).toBe("chat-b"); // not yanked
    expect(state.chats.some((c) => c.id === "chat-real-9")).toBe(true); // still swapped in list
  });

  it("failure fallback: clearing currentChat of a temp id leaves a consistent store", () => {
    const temp = makeChat({ id: "temp-fail" });
    const { setChats, setCurrentChat } = useChatStore.getState();
    setChats([temp]);
    setCurrentChat(temp);

    // Simulates createChat failure: hook clears the temp chat.
    const { currentChat, setCurrentChat: setC, setMessages } = useChatStore.getState();
    if (currentChat?.id === "temp-fail") {
      setC(null);
      setMessages([]);
    }

    const state = useChatStore.getState();
    expect(state.currentChat).toBeNull();
    expect(state.messages).toHaveLength(0);
  });
});
