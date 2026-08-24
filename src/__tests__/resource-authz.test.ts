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

const authMock: AnyMock = jest.fn(async () => ({ user: { id: "user-1" } }));
jest.mock("@/lib/auth", () => ({ auth: () => authMock() }));

const mockCanAccessProject: AnyMock = jest.fn(async () => true);
const mockCanAccessChat: AnyMock = jest.fn(async () => true);
jest.mock("@/lib/resource-access", () => ({
  canAccessProject: () => mockCanAccessProject(),
  canAccessChat: () => mockCanAccessChat(),
}));

const mockWorkspaceMemberFindUnique: AnyMock = jest.fn();
jest.mock("@/lib/prisma", () => ({
  prisma: { workspaceMember: { findUnique: mockWorkspaceMemberFindUnique } },
}));

const mockActivityList: AnyMock = jest.fn(async () => ({ items: [], total: 0 }));
const mockActivityRecord: AnyMock = jest.fn(async (data: Record<string, unknown>) => ({ id: "a1", ...data }));
const mockAggregate: AnyMock = jest.fn(async () => ({ byType: [], total: 0 }));
jest.mock("@/services/ActivityService", () => ({
  activityService: { list: mockActivityList, record: mockActivityRecord, aggregate: mockAggregate },
}));

const mockAuditList: AnyMock = jest.fn(async () => ({ items: [], total: 0 }));
jest.mock("@/services/AuditLogService", () => ({
  auditLogService: { list: mockAuditList, record: jest.fn() },
}));

const mockIsWorkspaceMember: AnyMock = jest.fn(async () => true);
jest.mock("@/middleware/permissionMiddleware", () => ({
  permissionMiddleware: { isWorkspaceMember: () => mockIsWorkspaceMember() },
}));

const mockTrackUsage: AnyMock = jest.fn(async () => ({ id: "u1" }));
jest.mock("@/services/UsageService", () => ({
  usageService: { trackUsage: mockTrackUsage },
}));

const mockGetPrompt: AnyMock = jest.fn(async () => null);
const mockListVersions: AnyMock = jest.fn(async () => []);
jest.mock("@/services/PromptService", () => ({
  promptService: {
    getPrompt: () => mockGetPrompt(),
    listVersions: mockListVersions,
    getVersion: jest.fn(async () => ({ id: "v1" })),
    deletePromptVersion: jest.fn(async () => true),
  },
}));

function jsonReq(path: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function getCtx(params: Record<string, string> = {}) {
  return { params: Promise.resolve(params) } as never;
}

describe("activity API authorization", () => {
  let activityRoute: typeof import("@/app/api/activity/route");

  beforeEach(async () => {
    jest.resetModules();
    activityRoute = await import("@/app/api/activity/route");
  });

  it("rejects listing another user's activity", async () => {
    const res = await activityRoute.GET(new NextRequest("http://localhost/api/activity?userId=victim"), getCtx());
    expect(res.status).toBe(403);
    expect(mockActivityList).not.toHaveBeenCalled();
  });

  it("rejects listing activity for an inaccessible project", async () => {
    mockCanAccessProject.mockImplementation(async () => false);
    const res = await activityRoute.GET(new NextRequest("http://localhost/api/activity?projectId=p-other"), getCtx());
    expect(res.status).toBe(403);
    mockCanAccessProject.mockImplementation(async () => true);
  });

  it("lists the caller's own activity when no filter is given", async () => {
    const res = await activityRoute.GET(new NextRequest("http://localhost/api/activity"), getCtx());
    expect(res.status).toBe(200);
    expect(mockActivityList).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }));
  });

  it("ignores a client-claimed userId when recording activity", async () => {
    const res = await activityRoute.POST(
      jsonReq("/api/activity", { userId: "victim", type: "view", title: "T" }),
      getCtx()
    );
    expect(res.status).toBe(201);
    expect(mockActivityRecord).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }));
  });
});

describe("audit log API authorization", () => {
  let auditRoute: typeof import("@/app/api/audit/logs/route");

  beforeEach(async () => {
    jest.resetModules();
    auditRoute = await import("@/app/api/audit/logs/route");
  });

  it("rejects reading another user's audit logs", async () => {
    const res = await auditRoute.GET(new NextRequest("http://localhost/api/audit/logs?actorId=victim"), getCtx());
    expect(res.status).toBe(403);
    expect(mockAuditList).not.toHaveBeenCalled();
  });

  it("rejects reading audit logs for a workspace the caller does not belong to", async () => {
    mockIsWorkspaceMember.mockImplementation(async () => false);
    const res = await auditRoute.GET(new NextRequest("http://localhost/api/audit/logs?workspaceId=ws-other"), getCtx());
    expect(res.status).toBe(403);
    mockIsWorkspaceMember.mockImplementation(async () => true);
  });

  it("scopes the query to the caller's own logs", async () => {
    mockWorkspaceMemberFindUnique.mockImplementation(async () => ({ id: "m1" }));
    const res = await auditRoute.GET(new NextRequest("http://localhost/api/audit/logs?workspaceId=ws-1"), getCtx());
    expect(res.status).toBe(200);
    expect(mockAuditList).toHaveBeenCalledWith(expect.objectContaining({ actorId: "user-1", workspaceId: "ws-1" }));
  });
});

describe("workspace usage attribution", () => {
  let usageRoute: typeof import("@/app/api/workspaces/[id]/usage/route");

  beforeEach(async () => {
    jest.resetModules();
    usageRoute = await import("@/app/api/workspaces/[id]/usage/route");
  });

  it("attributes usage to the caller, not a client-claimed userId", async () => {
    const res = await usageRoute.POST(
      jsonReq("/api/workspaces/ws-1/usage", { userId: "victim", type: "chat", amount: 5 }),
      getCtx({ id: "ws-1" })
    );
    expect(res.status).toBe(201);
    expect(mockTrackUsage).toHaveBeenCalledWith("user-1", "chat", 5);
  });

  it("rejects negative or excessive usage amounts", async () => {
    const res = await usageRoute.POST(
      jsonReq("/api/workspaces/ws-1/usage", { type: "chat", amount: -10 }),
      getCtx({ id: "ws-1" })
    );
    expect(res.status).toBe(400);
  });
});

describe("prompt version ownership", () => {
  let versionsRoute: typeof import("@/app/api/prompt-versions/route");

  beforeEach(async () => {
    jest.resetModules();
    versionsRoute = await import("@/app/api/prompt-versions/route");
  });

  it("404s listing versions of a prompt the caller does not own", async () => {
    mockGetPrompt.mockImplementation(async () => null);
    const res = await versionsRoute.GET(new NextRequest("http://localhost/api/prompt-versions?promptId=p-other"), getCtx());
    expect(res.status).toBe(404);
    expect(mockListVersions).not.toHaveBeenCalled();
  });

  it("allows version ops for owned prompts", async () => {
    mockGetPrompt.mockImplementation(async () => ({ id: "p-1", userId: "user-1" }));
    const res = await versionsRoute.GET(new NextRequest("http://localhost/api/prompt-versions?promptId=p-1"), getCtx());
    expect(res.status).toBe(200);
    expect(mockListVersions).toHaveBeenCalledWith("p-1");
  });
});
