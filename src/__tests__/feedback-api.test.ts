import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";

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
  checkEndpointLimit: jest.fn(async () => ({ allowed: true, limit: 5, window: "minute", remaining: 5 })),
  checkIpLimit: jest.fn(async () => ({ allowed: true, limit: 30, window: "minute", remaining: 30 })),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<(...args: any[]) => any>;

const authMock: AnyMock = jest.fn();
jest.mock("@/lib/auth", () => ({ auth: () => authMock() }));

const userFindUniqueMock: AnyMock = jest.fn();
const feedbackCreateMock: AnyMock = jest.fn();
const feedbackFindManyMock: AnyMock = jest.fn();
const feedbackFindUniqueMock: AnyMock = jest.fn();
const feedbackUpdateMock: AnyMock = jest.fn();
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUniqueMock },
    feedback: {
      create: feedbackCreateMock,
      findMany: feedbackFindManyMock,
      findUnique: feedbackFindUniqueMock,
      update: feedbackUpdateMock,
    },
  },
}));

const queueEnqueue: AnyMock = jest.fn(async () => "job-1");
jest.mock("@/services/QueueService", () => ({
  queueService: { enqueue: (...args: unknown[]) => queueEnqueue(...args) },
}));

const isAdminMock: AnyMock = jest.fn();
jest.mock("@/lib/admin", () => ({ isGlobalAdmin: () => isAdminMock() }));

const REAL_FEEDBACK_EMAIL = process.env.FEEDBACK_NOTIFICATION_EMAIL;

async function postFeedback(body: unknown, userId = "user-1") {
  const { POST } = await import("@/app/api/feedback/route");
  authMock.mockResolvedValue({ user: { id: userId } });
  const req = new NextRequest("http://localhost/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req, { params: Promise.resolve({}) });
}

describe("POST /api/feedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (REAL_FEEDBACK_EMAIL === undefined) delete process.env.FEEDBACK_NOTIFICATION_EMAIL;
    else process.env.FEEDBACK_NOTIFICATION_EMAIL = REAL_FEEDBACK_EMAIL;
  });

  it("rejects unauthenticated requests (401)", async () => {
    const { POST } = await import("@/app/api/feedback/route");
    authMock.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category: "bug", message: "hi" }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
  });

  it("rejects invalid category and empty message (400)", async () => {
    let res = await postFeedback({ category: "nonsense", message: "hi" });
    expect(res.status).toBe(400);
    res = await postFeedback({ category: "bug", message: "   " });
    expect(res.status).toBe(400);
    expect(feedbackCreateMock).not.toHaveBeenCalled();
  });

  it("rejects out-of-range rating (400)", async () => {
    const res = await postFeedback({ category: "bug", rating: 9, message: "hi" });
    expect(res.status).toBe(400);
  });

  it("creates feedback scoped to the session user, ignoring any body userId", async () => {
    feedbackCreateMock.mockResolvedValue({
      id: "fb-1",
      category: "bug",
      rating: 3,
      message: "Editor crashes on paste",
      page: "/chat",
      status: "NEW",
      createdAt: new Date().toISOString(),
    });
    const res = await postFeedback(
      { category: "bug", rating: 3, message: "Editor crashes on paste", page: "/chat", userId: "attacker-id" },
      "session-user"
    );
    expect(res.status).toBe(201);
    expect(feedbackCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "session-user" }),
      })
    );
    expect((feedbackCreateMock.mock.calls[0][0] as { data: { userId: string } }).data.userId).toBe("session-user");
  });

  it("enqueues an email notification when FEEDBACK_NOTIFICATION_EMAIL is set", async () => {
    process.env.FEEDBACK_NOTIFICATION_EMAIL = "ops@tonecraft.app";
    feedbackCreateMock.mockResolvedValue({
      id: "fb-1",
      category: "feature_request",
      rating: null,
      message: "Add dark mode",
      page: "/settings",
      status: "NEW",
      createdAt: new Date().toISOString(),
    });
    userFindUniqueMock.mockResolvedValue({ email: "user@example.com", name: "Jane" });
    await postFeedback({ category: "feature_request", message: "Add dark mode", page: "/settings" });
    expect(queueEnqueue).toHaveBeenCalledWith(
      "email",
      expect.objectContaining({ to: "ops@tonecraft.app", title: expect.stringContaining("feature_request") })
    );
  });

  it("skips the email enqueue when no inbox is configured", async () => {
    delete process.env.FEEDBACK_NOTIFICATION_EMAIL;
    feedbackCreateMock.mockResolvedValue({
      id: "fb-1",
      category: "general",
      rating: null,
      message: "Great app",
      page: null,
      status: "NEW",
      createdAt: new Date().toISOString(),
    });
    await postFeedback({ category: "general", message: "Great app" });
    expect(queueEnqueue).not.toHaveBeenCalled();
  });
});

describe("admin feedback endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/admin/feedback requires global admin (403 for non-admins)", async () => {
    isAdminMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/admin/feedback/route");
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    const res = await GET(new NextRequest("http://localhost/api/admin/feedback"), { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
  });

  it("GET /api/admin/feedback lists items for a global admin", async () => {
    isAdminMock.mockResolvedValue(true);
    feedbackFindManyMock.mockResolvedValue([{ id: "fb-1", category: "bug", message: "x", status: "NEW" }]);
    const { GET } = await import("@/app/api/admin/feedback/route");
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    const res = await GET(
      new NextRequest("http://localhost/api/admin/feedback?category=bug&status=NEW"),
      { params: Promise.resolve({}) }
    );
    expect(res.status).toBe(200);
    expect(feedbackFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category: "bug", status: "NEW" } })
    );
  });

  it("GET /api/admin/feedback rejects invalid filter values (400)", async () => {
    isAdminMock.mockResolvedValue(true);
    const { GET } = await import("@/app/api/admin/feedback/route");
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    const res = await GET(
      new NextRequest("http://localhost/api/admin/feedback?status=WIP"),
      { params: Promise.resolve({}) }
    );
    expect(res.status).toBe(400);
  });

  it("PATCH /api/admin/feedback/[id] requires global admin (403)", async () => {
    isAdminMock.mockResolvedValue(false);
    const { PATCH } = await import("@/app/api/admin/feedback/[id]/route");
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    const req = new NextRequest("http://localhost/api/admin/feedback/fb-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "fb-1" }) });
    expect(res.status).toBe(403);
  });

  it("PATCH updates status and records the reviewing admin", async () => {
    isAdminMock.mockResolvedValue(true);
    feedbackFindUniqueMock.mockResolvedValue({ id: "fb-1", status: "NEW" });
    feedbackUpdateMock.mockResolvedValue({
      id: "fb-1",
      category: "bug",
      rating: null,
      message: "x",
      page: null,
      status: "RESOLVED",
      reviewedAt: new Date().toISOString(),
      reviewedBy: "admin-1",
      createdAt: new Date().toISOString(),
    });
    const { PATCH } = await import("@/app/api/admin/feedback/[id]/route");
    authMock.mockResolvedValue({ user: { id: "admin-1" } });
    const req = new NextRequest("http://localhost/api/admin/feedback/fb-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "fb-1" }) });
    expect(res.status).toBe(200);
    expect(feedbackUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "fb-1" }, data: expect.objectContaining({ status: "RESOLVED", reviewedBy: "admin-1" }) })
    );
  });

  it("PATCH rejects an invalid status (400)", async () => {
    isAdminMock.mockResolvedValue(true);
    const { PATCH } = await import("@/app/api/admin/feedback/[id]/route");
    authMock.mockResolvedValue({ user: { id: "admin-1" } });
    const req = new NextRequest("http://localhost/api/admin/feedback/fb-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "fb-1" }) });
    expect(res.status).toBe(400);
  });
});
