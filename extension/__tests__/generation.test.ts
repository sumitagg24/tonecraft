/**
 * Extension generation-orchestration tests (fetch is mocked; no network).
 * Verifies tool→endpoint mapping, payload shapes, error normalization,
 * and request cancellation.
 */
import { generate } from "../src/background/generation";
import { ExtensionError } from "../src/shared/errors";
import type { GenerateRequest } from "../src/shared/types";

function req(overrides: Partial<GenerateRequest> = {}): GenerateRequest {
  return {
    requestId: "r-test",
    toolId: "rewrite",
    input: "hey can u send me that thing asap",
    target: null,
    host: "example.com",
    ...overrides,
  };
}

interface Seen {
  url: string;
  body: Record<string, unknown>;
}

let seen: Seen[] = [];

function mockFetchOnce(status: number, json: unknown) {
  seen = [];
  (global as unknown as { fetch: unknown }).fetch = jest.fn(async (url: string, init: { body?: string }) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => json,
  }));
  const fetchMock = (global as unknown as { fetch: jest.Mock }).fetch;
  fetchMock.mockImplementation(async (url: string, init: { body?: string }) => {
    seen.push({ url, body: JSON.parse(init.body ?? "{}") as Record<string, unknown> });
    return { ok: status >= 200 && status < 300, status, json: async () => json };
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("generate mapping", () => {
  test("rewrite → POST /api/ai/assist with action rewrite", async () => {
    mockFetchOnce(200, { success: true, data: "Rewritten text" });
    const controller = new AbortController();
    const out = await generate(req(), controller.signal);
    expect(out.content).toBe("Rewritten text");
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toMatch(/\/api\/ai\/assist$/);
    expect(seen[0].body.action).toBe("rewrite");
    expect(seen[0].body.text).toContain("hey can u");
  });

  test("improve → POST /api/tools with toolId enhance", async () => {
    mockFetchOnce(200, { success: true, data: { content: "Improved!" } });
    const out = await generate(req({ toolId: "improve" }), new AbortController().signal);
    expect(out.content).toBe("Improved!");
    expect(seen[0].url).toMatch(/\/api\/tools$/);
    expect(seen[0].body.toolId).toBe("enhance");
  });

  test("shorten → enhance + length short", async () => {
    mockFetchOnce(200, { success: true, data: { content: "Short." } });
    await generate(req({ toolId: "shorten" }), new AbortController().signal);
    expect(seen[0].body.toolId).toBe("enhance");
    expect(seen[0].body.length).toBe("short");
  });

  test("tone=professional → direct professional-rewrite tool", async () => {
    mockFetchOnce(200, { success: true, data: { content: "Professional." } });
    await generate(req({ toolId: "tone", tone: "professional" }), new AbortController().signal);
    expect(seen[0].url).toMatch(/\/api\/tools$/);
    expect(seen[0].body.toolId).toBe("professional-rewrite");
  });

  test("unknown toolId → BAD_INPUT without network", async () => {
    mockFetchOnce(200, { success: true, data: "x" });
    await expect(generate(req({ toolId: "nope" }), new AbortController().signal)).rejects.toMatchObject({
      code: "BAD_INPUT",
    });
    expect(seen).toHaveLength(0);
  });
});

describe("generate error normalization", () => {
  test("401 → UNAUTHORIZED", async () => {
    mockFetchOnce(401, { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    const err = await generate(req(), new AbortController().signal).then(
      (): ExtensionError => {
        throw new Error("expected rejection");
      },
      (e: unknown): ExtensionError => {
        expect(e).toBeInstanceOf(ExtensionError);
        return e as ExtensionError;
      },
    );
    expect(err.code).toBe("UNAUTHORIZED");
  });

  test("429 → RATE_LIMITED", async () => {
    mockFetchOnce(429, { success: false, error: { code: "RATE_LIMITED", message: "slow down" } });
    const err = await generate(req(), new AbortController().signal).then(
      (): ExtensionError => {
        throw new Error("expected rejection");
      },
      (e: unknown): ExtensionError => {
        expect(e).toBeInstanceOf(ExtensionError);
        return e as ExtensionError;
      },
    );
    expect(err.code).toBe("RATE_LIMITED");
  });

  test("empty content → SERVER", async () => {
    mockFetchOnce(200, { success: true, data: { content: "   " } });
    const err = await generate(req({ toolId: "improve" }), new AbortController().signal).then(
      (): ExtensionError => {
        throw new Error("expected rejection");
      },
      (e: unknown): ExtensionError => {
        expect(e).toBeInstanceOf(ExtensionError);
        return e as ExtensionError;
      },
    );
    expect(err.code).toBe("SERVER");
  });

  test("aborted signal propagates AbortError", async () => {
    (global as unknown as { fetch: unknown }).fetch = jest.fn(
      (_url: string, init: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          const onAbort = () => {
            reject(new DOMException("aborted", "AbortError"));
          };
          if (init.signal?.aborted) {
            onAbort();
            return;
          }
          init.signal?.addEventListener("abort", onAbort, { once: true });
        }),
    );
    const controller = new AbortController();
    const pending = generate(req(), controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
