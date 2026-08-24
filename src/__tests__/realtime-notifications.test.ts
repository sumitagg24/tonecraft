import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import type { Server as SocketIOServer } from "socket.io";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<(...args: any[]) => any>;

// File-scope mocks referenced by the jest.mock factories below — same pattern
// as the existing test files.
const prefFindUniqueMock: AnyMock = jest.fn();
const loggerErrorMock: AnyMock = jest.fn();

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: loggerErrorMock },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    notificationPreference: { findUnique: prefFindUniqueMock },
    notification: { create: jest.fn(), findMany: jest.fn() },
    pushSubscription: { findMany: jest.fn(), deleteMany: jest.fn() },
    user: { findUnique: jest.fn() },
    presence: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() },
    typingIndicator: { upsert: jest.fn(), deleteMany: jest.fn() },
    documentOperation: { create: jest.fn() },
  },
}));

jest.mock("@/services/QueueService", () => ({
  queueService: { enqueue: jest.fn(async () => "job-1") },
}));

jest.mock("@clerk/nextjs/server", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/resource-access", () => ({
  canAccessChat: jest.fn(async () => true),
  canAccessProject: jest.fn(async () => true),
}));

jest.mock("socket.io", () => ({
  Server: jest.fn(),
}));

// Preferences enabling ONLY the realtime channel — in-app/email/push are off,
// so the broadcast path is the sole thing under test.
const REALTIME_ONLY_PREFS = {
  userId: "user-1",
  emailEnabled: false,
  pushEnabled: false,
  inAppEnabled: false,
  realtimeEnabled: true,
  dailyDigest: false,
  generationComplete: true,
  creditsLow: true,
  knowledgeReady: true,
  exportReady: true,
  invite: true,
  comment: true,
  mention: true,
  subscription: true,
  system: true,
};

/**
 * Minimal Socket.IO server stand-in: records the middleware/handlers attached
 * (`use`/`on`) and the room broadcasts (`to(room).emit(...)`).
 */
function makeFakeIo() {
  const roomEmit = jest.fn();
  const to = jest.fn(() => ({ emit: roomEmit }));
  return { use: jest.fn(), on: jest.fn(), to, roomEmit };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// The realtime singleton is module state — reset the registry per test so
// every test starts from a cold state (same pattern as webpush.test.ts).
afterEach(() => {
  jest.resetModules();
});

describe("src/lib/realtime — the active server singleton", () => {
  it("returns null before the socket route has registered a server", async () => {
    const { getRealtimeServer } = await import("@/lib/realtime");
    expect(getRealtimeServer()).toBeNull();
  });

  it("round-trips the instance registered via setRealtimeServer", async () => {
    const realtime = await import("@/lib/realtime");
    const fake = makeFakeIo();
    realtime.setRealtimeServer(fake as unknown as SocketIOServer);
    expect(realtime.getRealtimeServer()).toBe(fake);
  });
});

describe("src/app/api/socket/route — the active socket server", () => {
  it("registers the Socket.IO server it creates with the realtime singleton", async () => {
    const realtime = await import("@/lib/realtime");
    const { Server } = await import("socket.io");
    const fake = makeFakeIo();
    (Server as unknown as jest.Mock).mockReturnValue(fake);

    const { GET } = await import("@/app/api/socket/route");
    const res = await GET();

    expect(res.status).toBe(200);
    expect(realtime.getRealtimeServer()).toBe(fake);
    // The JWT middleware and connection handlers are attached to that instance.
    expect(fake.use).toHaveBeenCalled();
    expect(fake.on).toHaveBeenCalledWith("connection", expect.any(Function));
  });
});

describe("realtime notification broadcasts", () => {
  it("broadcasts to the user's room through the server the socket route registers", async () => {
    const { Server } = await import("socket.io");
    const fake = makeFakeIo();
    (Server as unknown as jest.Mock).mockReturnValue(fake);

    const { GET } = await import("@/app/api/socket/route");
    await GET();

    const { notificationService } = await import("@/services/NotificationService");
    prefFindUniqueMock.mockResolvedValue(REALTIME_ONLY_PREFS);

    const ok = await notificationService.create({
      userId: "user-1",
      type: "comment",
      title: "New comment on your prompt",
      body: "Nice work",
      link: "/chat/abc",
    });

    expect(ok).toBe(true);
    expect(fake.to).toHaveBeenCalledWith("user:user-1");
    expect(fake.roomEmit).toHaveBeenCalledWith(
      "notification",
      expect.objectContaining({
        type: "comment",
        title: "New comment on your prompt",
        link: "/chat/abc",
      })
    );
  });

  it("also broadcasts to the workspace room when workspaceId is provided", async () => {
    const realtime = await import("@/lib/realtime");
    const fake = makeFakeIo();
    realtime.setRealtimeServer(fake as unknown as SocketIOServer);

    const { notificationService } = await import("@/services/NotificationService");
    prefFindUniqueMock.mockResolvedValue(REALTIME_ONLY_PREFS);

    await notificationService.create({
      userId: "user-1",
      type: "team_invite",
      title: "Workspace invitation",
      body: "Join Acme",
      workspaceId: "ws-9",
    });

    expect(fake.to).toHaveBeenCalledWith("user:user-1");
    expect(fake.to).toHaveBeenCalledWith("workspace:ws-9");
    expect(fake.roomEmit).toHaveBeenCalledWith(
      "workspace-notification",
      expect.objectContaining({ userId: "user-1", type: "team_invite", title: "Workspace invitation" })
    );
  });

  it("no-ops gracefully when no server is registered (serverless cold start)", async () => {
    const { notificationService } = await import("@/services/NotificationService");
    prefFindUniqueMock.mockResolvedValue(REALTIME_ONLY_PREFS);

    const ok = await notificationService.create({
      userId: "user-1",
      type: "comment",
      title: "New comment",
      workspaceId: "ws-9",
    });

    expect(ok).toBe(true);
    // The null-server path must not throw or log an error — both the user and
    // workspace branches are guarded (workspace branch had a `.emit`-on-null
    // bug before the io?. emit guard).
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });
});
