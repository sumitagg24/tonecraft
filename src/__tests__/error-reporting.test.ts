import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { reportErrorAsync, reportError, flushErrorReports } from "@/lib/error-reporting";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchMock = jest.fn() as jest.Mock<(...args: any[]) => Promise<any>>;

beforeEach(() => {
  jest.resetModules();
  fetchMock.mockClear();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = fetchMock;
  // DSN must be set for the reporter to activate. Keep it isolated per test.
  process.env.SENTRY_DSN = "https://PUBLIC_KEY@o123.ingest.sentry.io/456";
});

afterEach(() => {
  delete process.env.SENTRY_DSN;
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
});

describe("Sentry envelope error reporter (server-side)", () => {
  it("sends a well-formed envelope when SENTRY_DSN is configured", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    const boom = new Error("boom");
    await reportErrorAsync(boom);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://o123.ingest.sentry.io/api/456/envelope/");

    const body = String(init.body);
    const lines = body.split("\n");
    expect(lines).toHaveLength(3);

    const header = JSON.parse(lines[0]);
    expect(header.event_id).toMatch(/^[0-9a-f]{32}$/);
    expect(header.dsn).toBe("https://PUBLIC_KEY@o123.ingest.sentry.io/456");

    const itemHeader = JSON.parse(lines[1]);
    expect(itemHeader.type).toBe("event");

    const event = JSON.parse(lines[2]);
    expect(event.exception.values[0].type).toBe("Error");
    expect(event.exception.values[0].value).toBe("boom");
    expect(event.platform).toBe("javascript");
    expect(event.logger).toBe("tonecraft");

    expect(init.headers).toMatchObject({
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": expect.stringContaining("sentry_key=PUBLIC_KEY"),
    });
  });

  it("is a no-op when no DSN is configured", async () => {
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    await reportErrorAsync(new Error("silent"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("attaches userId, digest, and request context to the event", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    await reportErrorAsync(new Error("auth failed"), {
      userId: "user-42",
      digest: "digest-abc",
      request: {
        method: "POST",
        url: "/api/chats/123/messages",
        headers: { "user-agent": "jest", "x-forwarded-for": "203.0.113.9", cookie: "secret=1" },
      },
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const event = JSON.parse(String(init.body).split("\n")[2]);

    expect(event.user).toEqual({ id: "user-42" });
    expect(event.digest).toBe("digest-abc");
    expect(event.request).toEqual({
      url: "/api/chats/123/messages",
      method: "POST",
      // Sensitive headers (cookie) must never be forwarded.
      headers: expect.objectContaining({ "user-agent": "jest", "x-forwarded-for": "203.0.113.9" }),
    });
    expect(event.request.headers.cookie).toBeUndefined();
  });

  it("is awaited — delivery completes before the promise resolves", async () => {
    let resolveFetch: () => void = () => {};
    fetchMock.mockReturnValue(new Promise((resolve) => {
      resolveFetch = () => resolve({ ok: true });
    }));

    let settled = false;
    const report = reportErrorAsync(new Error("slow network"));
    report.finally(() => { settled = true; });

    // Give the reporter a tick to start the fetch, then confirm it's still pending.
    await new Promise((r) => setTimeout(r, 10));
    expect(settled).toBe(false);

    resolveFetch();
    await report;
    expect(settled).toBe(true);
  });

  it("flush waits for in-flight reports", async () => {
    let resolveFetch: () => void = () => {};
    fetchMock.mockReturnValue(new Promise((resolve) => {
      resolveFetch = () => resolve({ ok: true });
    }));

    // Fire-and-forget via reportError (logger path), then flush must wait for it.
    reportError(new Error("bg task failed"));
    await new Promise((r) => setTimeout(r, 10));

    const flushed = flushErrorReports();
    let done = false;
    flushed.finally(() => { done = true; });
    await new Promise((r) => setTimeout(r, 10));
    expect(done).toBe(false);

    resolveFetch();
    await flushed;
    expect(done).toBe(true);
  });

  it("never throws when the delivery fetch fails", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(reportErrorAsync(new Error("app error"))).resolves.toBeUndefined();
  });

  it("strips query strings from the referer header (privacy)", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    await reportErrorAsync(new Error("privacy"), {
      request: {
        method: "GET",
        url: "/dashboard",
        headers: { referer: "https://app.example.com/chat?token=secret&id=42" },
      },
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const event = JSON.parse(String(init.body).split("\n")[2]);
    expect(event.request.headers.referer).toBe("https://app.example.com/chat");
    expect(event.request.headers.referer).not.toContain("token=");
  });

  it("uses NEXT_PUBLIC_SENTRY_DSN as a fallback DSN", async () => {
    delete process.env.SENTRY_DSN;
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://PUBLIC_KEY@o789.ingest.sentry.io/1011";
    fetchMock.mockResolvedValue({ ok: true });

    await reportErrorAsync(new Error("client-ish"));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("https://o789.ingest.sentry.io/api/1011/envelope/");
  });
});
