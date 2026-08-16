import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";

// ── Shared mocks ─────────────────────────────────────────────────────────
// The withApiHandler wrapper imports auth + ratelimit; the share route imports
// prisma. Everything else (logger, error-reporting) is mocked to silence it.

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
  checkEndpointLimit: jest.fn(async () => ({ allowed: true, limit: 30, window: "minute", remaining: 30 })),
  checkIpLimit: jest.fn(async () => ({ allowed: true, limit: 120, window: "minute", remaining: 120 })),
}));

// ── Cron guard ────────────────────────────────────────────────────────────

describe("guardCronRequest (CRON_SECRET)", () => {
  const ORIGINAL = process.env.CRON_SECRET;
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = ORIGINAL;
  });

  async function loadGuard() {
    const mod = await import("@/lib/cron-guard");
    return mod.guardCronRequest;
  }

  it("rejects requests without an Authorization header (401)", async () => {
    process.env.CRON_SECRET = "s3cret";
    const guard = await loadGuard();
    const res = guard(new NextRequest("http://localhost/api/cron/daily"));
    expect(res?.status).toBe(401);
  });

  it("rejects requests with the wrong secret (401)", async () => {
    process.env.CRON_SECRET = "s3cret";
    const guard = await loadGuard();
    const req = new NextRequest("http://localhost/api/cron/daily", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const res = guard(req);
    expect(res?.status).toBe(401);
  });

  it("accepts requests with the correct bearer secret (null = proceed)", async () => {
    process.env.CRON_SECRET = "s3cret";
    const guard = await loadGuard();
    const req = new NextRequest("http://localhost/api/cron/daily", {
      headers: { authorization: "Bearer s3cret" },
    });
    expect(guard(req)).toBeNull();
  });

  it("fails closed (503) when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const guard = await loadGuard();
    const req = new NextRequest("http://localhost/api/cron/daily", {
      headers: { authorization: "Bearer anything" },
    });
    const res = guard(req);
    expect(res?.status).toBe(503);
  });

  it("accepts a valid Vercel cron request (schedule header + UA + bearer)", async () => {
    process.env.CRON_SECRET = "s3cret";
    const guard = await loadGuard();
    const req = new NextRequest("http://localhost/api/cron/daily", {
      headers: {
        authorization: "Bearer s3cret",
        "x-vercel-cron-schedule": "0 9 * * *",
        "user-agent": "vercel-cron/1.0",
      },
    });
    expect(guard(req)).toBeNull();
  });

  it("rejects a spoofed schedule header without the Vercel user agent (401)", async () => {
    process.env.CRON_SECRET = "s3cret";
    const guard = await loadGuard();
    const req = new NextRequest("http://localhost/api/cron/daily", {
      headers: {
        authorization: "Bearer s3cret",
        "x-vercel-cron-schedule": "0 9 * * *",
        "user-agent": "curl/8.0",
      },
    });
    expect(guard(req)?.status).toBe(401);
  });

  it("rejects an invalid cron expression in the schedule header (401)", async () => {
    process.env.CRON_SECRET = "s3cret";
    const guard = await loadGuard();
    const req = new NextRequest("http://localhost/api/cron/daily", {
      headers: {
        authorization: "Bearer s3cret",
        "x-vercel-cron-schedule": "not-a-cron",
        "user-agent": "vercel-cron/1.0",
      },
    });
    expect(guard(req)?.status).toBe(401);
  });
});

// ── withApiHandler auth default ───────────────────────────────────────────

describe("withApiHandler — authentication default", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyMock = jest.Mock<(...args: any[]) => any>;
  let authMock: AnyMock;
  let updateManyMock: AnyMock;
  let findUniqueMock: AnyMock;

  beforeEach(async () => {
    jest.resetModules();
    authMock = jest.fn();
    updateManyMock = jest.fn(async () => ({ count: 1 }));
    findUniqueMock = jest.fn();
    jest.mock("@/lib/auth", () => ({ auth: () => authMock() }));
    jest.mock("@/lib/prisma", () => ({
      prisma: { shareLink: { findUnique: findUniqueMock, updateMany: updateManyMock } },
    }));
  });

  it("returns 401 when no session exists", async () => {
    authMock.mockResolvedValue(null);
    const { DELETE } = await import("@/app/api/share/[token]/route");
    const req = new NextRequest("http://localhost/api/share/tok", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ token: "tok" }) });
    expect(res.status).toBe(401);
  });

  it("scopes share-link revocation to the authenticated owner (no IDOR)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    const { DELETE } = await import("@/app/api/share/[token]/route");
    const req = new NextRequest("http://localhost/api/share/tok", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ token: "tok" }) });
    expect(res.status).toBe(200);
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { token: "tok", userId: "user-1" },
      data: { revoked: true },
    });
  });

  it("404s when the token does not belong to the caller", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    updateManyMock.mockResolvedValue({ count: 0 });
    const { DELETE } = await import("@/app/api/share/[token]/route");
    const req = new NextRequest("http://localhost/api/share/tok", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ token: "tok" }) });
    expect(res.status).toBe(404);
  });

  it("serves share GET without a session (public-by-token, auth:false)", async () => {
    authMock.mockResolvedValue(null); // must not be consulted
    findUniqueMock.mockResolvedValue({
      token: "tok",
      revoked: false,
      expiresAt: null,
      createdAt: new Date().toISOString(),
      chat: { id: "c1", title: "Shared", messages: [{ id: "m1", role: "user", content: "hi", createdAt: new Date().toISOString() }] },
    });
    const { GET } = await import("@/app/api/share/[token]/route");
    const req = new NextRequest("http://localhost/api/share/tok");
    const res = await GET(req, { params: Promise.resolve({ token: "tok" }) });
    expect(res.status).toBe(200);
    // auth must never be consulted on the public GET
    expect(authMock).not.toHaveBeenCalled();
  });

  it("rejects revoked / expired share links", async () => {
    findUniqueMock.mockResolvedValue({
      token: "tok",
      revoked: true,
      expiresAt: null,
      createdAt: new Date().toISOString(),
      chat: null,
    });
    const { GET } = await import("@/app/api/share/[token]/route");
    const req = new NextRequest("http://localhost/api/share/tok");
    const res = await GET(req, { params: Promise.resolve({ token: "tok" }) });
    expect(res.status).toBe(404);
  });
});
