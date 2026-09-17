/**
 * Extension protocol validation tests.
 * Covers: message allowlist, generate-request allowlist, input caps,
 * editor-ref shape, open-site path traversal guard.
 */
import { validMessage, validGenerateRequest, sanitizeInput, newRequestId } from "../src/shared/validate";

function genReq(overrides: Record<string, unknown> = {}) {
  return {
    requestId: "r1",
    toolId: "rewrite",
    input: "hello world",
    target: null,
    host: "example.com",
    ...overrides,
  };
}

describe("validMessage", () => {
  test("accepts a well-formed TC_GENERATE", () => {
    expect(validMessage({ type: "TC_GENERATE", requestId: "r1", payload: genReq() })).toBe(true);
  });

  test("rejects unknown types", () => {
    expect(validMessage({ type: "PWN", requestId: "r1" })).toBe(false);
    expect(validMessage({ type: "TC_GENERATE", requestId: "r1", payload: genReq({ toolId: "rm -rf" }) })).toBe(false);
  });

  test("rejects non-objects and missing requestId", () => {
    expect(validMessage(null)).toBe(false);
    expect(validMessage("TC_GENERATE")).toBe(false);
    expect(validMessage({ type: "TC_CANCEL" })).toBe(false);
    expect(validMessage({ type: "TC_CANCEL", requestId: "x".repeat(65) })).toBe(false);
  });

  test("TC_OPEN_SITE allows safe paths, blocks traversal/schemes", () => {
    expect(validMessage({ type: "TC_OPEN_SITE", requestId: "r", payload: { path: "/pricing" } })).toBe(true);
    expect(validMessage({ type: "TC_OPEN_SITE", requestId: "r", payload: { path: "/tools?tool=x" } })).toBe(true);
    expect(validMessage({ type: "TC_OPEN_SITE", requestId: "r", payload: { path: "https://evil.com" } })).toBe(false);
    expect(validMessage({ type: "TC_OPEN_SITE", requestId: "r", payload: { path: "/../etc" } })).toBe(false);
    expect(validMessage({ type: "TC_OPEN_SITE", requestId: "r", payload: { path: "javascript:alert(1)" } })).toBe(false);
  });

  test("TC_INSERT validates mode, text size, editor ref", () => {
    const editor = { kind: "textarea", fingerprint: "{}", host: "x.com" };
    expect(
      validMessage({ type: "TC_INSERT", requestId: "r", payload: { mode: "replace", text: "hi", editor } }),
    ).toBe(true);
    expect(
      validMessage({ type: "TC_INSERT", requestId: "r", payload: { mode: "delete-all", text: "hi", editor } }),
    ).toBe(false);
    expect(
      validMessage({ type: "TC_INSERT", requestId: "r", payload: { mode: "insert", text: "", editor } }),
    ).toBe(false);
    expect(
      validMessage({ type: "TC_INSERT", requestId: "r", payload: { mode: "insert", text: "hi", editor: null } }),
    ).toBe(false);
  });
});

describe("validGenerateRequest", () => {
  test("rejects unknown tool ids (never send arbitrary strings)", () => {
    expect(validGenerateRequest(genReq({ toolId: "nope" }))).toBe(false);
  });

  test("rejects empty and oversized input", () => {
    expect(validGenerateRequest(genReq({ input: "   " }))).toBe(false);
    expect(validGenerateRequest(genReq({ input: "x".repeat(8001) }))).toBe(false);
    expect(validGenerateRequest(genReq({ input: "x".repeat(8000) }))).toBe(true);
  });

  test("rejects oversized instructions and bad length enum", () => {
    expect(validGenerateRequest(genReq({ instructions: "x".repeat(1501) }))).toBe(false);
    expect(validGenerateRequest(genReq({ length: "huge" }))).toBe(false);
    expect(validGenerateRequest(genReq({ length: "short" }))).toBe(true);
  });

  test("validates target shape", () => {
    expect(validGenerateRequest(genReq({ target: { tabId: 1, frameId: 0, editor: null } }))).toBe(true);
    expect(validGenerateRequest(genReq({ target: { tabId: "1", frameId: 0, editor: null } }))).toBe(false);
  });
});

describe("sanitizeInput / newRequestId", () => {
  test("trims and clamps", () => {
    expect(sanitizeInput("  hi  ")).toBe("hi");
    expect(sanitizeInput("x".repeat(9000)).length).toBe(8000);
  });

  test("request ids are unique strings", () => {
    const ids = new Set([newRequestId(), newRequestId(), newRequestId()]);
    expect(ids.size).toBe(3);
  });
});
