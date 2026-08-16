import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<(...args: any[]) => any>;

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/error-reporting", () => ({
  reportError: jest.fn(),
}));

jest.mock("@/lib/ratelimit", () => ({
  checkAuthedIpLimit: jest.fn(async () => ({ allowed: true, limit: 2000, window: "minute", remaining: 2000 })),
  checkAuthedUserLimit: jest.fn(async () => ({ allowed: true, limit: 1200, window: "minute", remaining: 1200 })),
  checkPublicIpLimit: jest.fn(async () => ({ allowed: true, limit: 30, window: "minute", remaining: 30 })),
  checkEndpointLimit: jest.fn(async () => ({ allowed: true, limit: 60, window: "minute", remaining: 60 })),
  checkIpLimit: jest.fn(async () => ({ allowed: true, limit: 120, window: "minute", remaining: 120 })),
}));

const authMock: AnyMock = jest.fn();
jest.mock("@/lib/auth", () => ({ auth: () => authMock() }));

const mockChatFindFirst: AnyMock = jest.fn();
const mockProjectFindFirst: AnyMock = jest.fn();
const mockProjectMemberFindUnique: AnyMock = jest.fn();
const mockWorkspaceMemberFindUnique: AnyMock = jest.fn();
jest.mock("@/lib/prisma", () => ({
  prisma: {
    chat: { findFirst: mockChatFindFirst },
    project: { findFirst: mockProjectFindFirst },
    projectMember: { findUnique: mockProjectMemberFindUnique },
    workspaceMember: { findUnique: mockWorkspaceMemberFindUnique },
  },
}));

const mockSetTyping: AnyMock = jest.fn();
const mockUpdatePresence: AnyMock = jest.fn();
const mockOptimize: AnyMock = jest.fn(async () => ({ totalCleaned: 0 }));
jest.mock("@/services/CollaborationService", () => ({
  collaborationService: { setTyping: mockSetTyping, updatePresence: mockUpdatePresence },
}));
jest.mock("@/lib/socket-storage", () => ({
  optimizeCollaborationStorage: mockOptimize,
}));

const isAdminMock: AnyMock = jest.fn();
jest.mock("@/lib/admin", () => ({ isGlobalAdmin: () => isAdminMock() }));

function jsonReq(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("collaboration authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    // Default: caller owns the chat.
    mockChatFindFirst.mockResolvedValue({ userId: "user-1", projectId: null });
    mockProjectFindFirst.mockResolvedValue({ userId: "user-1", workspaceId: null });
  });

  it("typing POST writes for the session user, never a client-claimed userId", async () => {
    const { POST } = await import("@/app/api/collaboration/typing/route");
    // body contains a foreign userId — must be ignored.
    const res = await POST(jsonReq("/api/collaboration/typing", { userId: "attacker", chatId: "c1", isTyping: true }), {
      params: Promise.resolve({}),
    });
    expect(res.status).toBe(200);
    expect(mockSetTyping).toHaveBeenCalledWith("user-1", "c1", true);
  });

  it("typing POST denies chats the caller does not own or belong to", async () => {
    mockChatFindFirst.mockResolvedValue({ userId: "other-user", projectId: null });
    const { POST } = await import("@/app/api/collaboration/typing/route");
    const res = await POST(jsonReq("/api/collaboration/typing", { chatId: "c1", isTyping: true }), {
      params: Promise.resolve({}),
    });
    expect(res.status).toBe(404);
    expect(mockSetTyping).not.toHaveBeenCalled();
  });

  it("presence POST writes presence for the session user only", async () => {
    mockUpdatePresence.mockResolvedValue({ userId: "user-1" });
    const { POST } = await import("@/app/api/presence/route");
    const res = await POST(jsonReq("/api/presence", { userId: "attacker", projectId: "p1", status: "active" }), {
      params: Promise.resolve({}),
    });
    expect(res.status).toBe(200);
    expect(mockUpdatePresence).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", projectId: "p1" })
    );
  });

  it("presence GET denies projects the caller cannot access", async () => {
    mockProjectFindFirst.mockResolvedValue({ userId: "other-user", workspaceId: null });
    const { GET } = await import("@/app/api/presence/route");
    const res = await GET(new NextRequest("http://localhost/api/presence?projectId=p1"), {
      params: Promise.resolve({}),
    });
    expect(res.status).toBe(404);
  });

  it("collaboration optimize requires global admin (403 for regular users)", async () => {
    isAdminMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/collaboration/optimize/route");
    const res = await POST(jsonReq("/api/collaboration/optimize", {}), { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
    expect(mockOptimize).not.toHaveBeenCalled();
  });

  it("collaboration optimize runs for global admins", async () => {
    isAdminMock.mockResolvedValue(true);
    const { POST } = await import("@/app/api/collaboration/optimize/route");
    const res = await POST(jsonReq("/api/collaboration/optimize", {}), { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    expect(mockOptimize).toHaveBeenCalled();
  });
});
