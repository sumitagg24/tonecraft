import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<(...args: any[]) => any>;

type AnyArgs = unknown[];

interface FakeSocket {
  connected: boolean;
  auth: Record<string, unknown>;
  emit: AnyMock;
  on: AnyMock;
  onAny: AnyMock;
  connect: AnyMock;
  disconnect: AnyMock;
  removeAllListeners: AnyMock;
  fireServerEvent: (event: string, data: unknown) => void;
}

jest.mock("socket.io-client", () => ({
  io: jest.fn(),
}));

let socket: FakeSocket | null = null;

function createFakeSocket(): FakeSocket {
  const anyHandlers: ((...args: AnyArgs) => void)[] = [];
  const onHandlers: Record<string, ((...args: AnyArgs) => void)[]> = {};
  const s = {
    connected: false,
    auth: {} as Record<string, unknown>,
    emit: jest.fn(),
    on: jest.fn((event: string, cb: (...args: AnyArgs) => void) => {
      const list = (onHandlers[event] ??= []);
      list.push(cb);
    }),
    onAny: jest.fn((cb: (...args: AnyArgs) => void) => {
      anyHandlers.push(cb);
    }),
    connect: jest.fn(() => {
      s.connected = true;
    }),
    disconnect: jest.fn(() => {
      s.connected = false;
    }),
    removeAllListeners: jest.fn(),
    fireServerEvent: (event: string, data: unknown) => {
      for (const cb of onHandlers[event] ?? []) cb(data);
      for (const cb of anyHandlers) cb(event, data);
    },
  };
  return s;
}

beforeEach(() => {
  jest.clearAllMocks();
  socket = createFakeSocket();
  const { io } = jest.requireMock("socket.io-client") as { io: AnyMock };
  io.mockReturnValue(socket);
});

// The singleton is module state — reset the registry per test (same pattern
// as webpush.test.ts / realtime-notifications.test.ts).
afterEach(() => {
  jest.resetModules();
  socket = null;
});

async function flushAsync() {
  await new Promise((r) => setTimeout(r, 0));
}

describe("client socket — room emits", () => {
  it("emits join/leave/typing events with the room payloads", async () => {
    const { joinChat, leaveChat, emitTyping } = await import("@/lib/socket-client");
    joinChat("chat-1");
    leaveChat("chat-1");
    emitTyping("chat-1", true);
    emitTyping("chat-1", false);

    expect(socket?.emit).toHaveBeenCalledTimes(4);
    expect(socket?.emit).toHaveBeenNthCalledWith(1, "join-chat", { chatId: "chat-1" });
    expect(socket?.emit).toHaveBeenNthCalledWith(2, "leave-chat", { chatId: "chat-1" });
    expect(socket?.emit).toHaveBeenNthCalledWith(3, "typing-start", { chatId: "chat-1" });
    expect(socket?.emit).toHaveBeenNthCalledWith(4, "typing-stop", { chatId: "chat-1" });
  });

  it("ignores optimistic temp chat ids (no server row to join)", async () => {
    const { joinChat, leaveChat, emitTyping, joinProject, leaveProject } = await import("@/lib/socket-client");
    joinChat("temp-123");
    emitTyping("temp-123", true);
    leaveChat("temp-123");
    joinProject("project-1");
    leaveProject("project-1");

    expect(socket?.emit).toHaveBeenCalledTimes(2);
    expect(socket?.emit).toHaveBeenNthCalledWith(1, "join-project", { projectId: "project-1" });
    expect(socket?.emit).toHaveBeenNthCalledWith(2, "leave-project", { projectId: "project-1" });
  });
});

describe("client socket — auth & connection", () => {
  it("attaches the Clerk JWT to the handshake and connects", async () => {
    const { connectSocket } = await import("@/lib/socket-client");
    connectSocket(async () => "clerk-token");
    await flushAsync();

    expect(socket?.auth).toEqual({ token: "clerk-token" });
    expect(socket?.connect).toHaveBeenCalledTimes(1);
  });

  it("refreshes the JWT on connect_error (expired token) and reconnects", async () => {
    const { connectSocket } = await import("@/lib/socket-client");
    let token: string | null = "expired-token";
    connectSocket(async () => token);
    await flushAsync();
    expect(socket?.auth).toEqual({ token: "expired-token" });

    token = "fresh-token";
    socket?.fireServerEvent("connect_error", new Error("handshake rejected"));
    await flushAsync();

    expect(socket?.auth).toEqual({ token: "fresh-token" });
    expect(socket?.connect).toHaveBeenCalled();
  });
});

describe("client socket — event registry", () => {
  it("forwards server events to onSocketEvent subscribers and unsubscribes", async () => {
    const { connectSocket, onSocketEvent } = await import("@/lib/socket-client");
    connectSocket();

    const received: unknown[] = [];
    const off = onSocketEvent("presence-update", (data) => {
      received.push(data);
    });

    socket?.fireServerEvent("presence-update", { userId: "u1", chatId: "c1", status: "active" });
    expect(received).toEqual([{ userId: "u1", chatId: "c1", status: "active" }]);

    off();
    socket?.fireServerEvent("presence-update", { userId: "u1", chatId: "c1", status: "offline" });
    expect(received).toHaveLength(1);
  });

  it("notifies status listeners on connect and disconnect", async () => {
    const { connectSocket, onRealtimeStatus } = await import("@/lib/socket-client");
    const seen: string[] = [];
    onRealtimeStatus((s) => seen.push(s));

    connectSocket();
    socket?.fireServerEvent("connect", undefined);
    socket?.fireServerEvent("disconnect", "io server disconnect");

    expect(seen).toEqual(["connecting", "connected", "disconnected"]);
  });
});
