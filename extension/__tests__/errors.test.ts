/**
 * Extension error-mapping tests.
 * Verifies coarse, non-leaking user messages for every server failure class.
 */
import { ExtensionError, fromServerFailure, userMessage } from "../src/shared/errors";

describe("fromServerFailure", () => {
  test("maps HTTP statuses", () => {
    expect(fromServerFailure("anything", 401)).toBe("UNAUTHORIZED");
    expect(fromServerFailure("RATE_LIMITED", 429)).toBe("RATE_LIMITED");
    expect(fromServerFailure("VALIDATION_ERROR", 400)).toBe("BAD_INPUT");
    expect(fromServerFailure("INTERNAL_ERROR", 500)).toBe("SERVER");
  });

  test("maps upgrade/credit exhaustion", () => {
    expect(fromServerFailure("UPGRADE_REQUIRED", 402)).toBe("UPGRADE_REQUIRED");
    expect(fromServerFailure("INSUFFICIENT_CREDITS", 402)).toBe("UPGRADE_REQUIRED");
  });
});

describe("userMessage", () => {
  test("every code has a human message that leaks nothing", () => {
    const codes = [
      "OFFLINE",
      "UNAUTHORIZED",
      "RATE_LIMITED",
      "UPGRADE_REQUIRED",
      "BAD_INPUT",
      "SERVER",
      "INSERT_FAILED",
      "EDITOR_GONE",
      "UNKNOWN",
    ] as const;
    for (const code of codes) {
      const msg = userMessage(code);
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(10);
      // No stack traces, no provider names, no raw codes.
      expect(msg).not.toMatch(/Error|Groq|OpenAI|sk-|undefined/);
    }
  });

  test("ExtensionError carries code + optional server code", () => {
    const err = new ExtensionError("RATE_LIMITED", "RATE_LIMITED");
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.serverCode).toBe("RATE_LIMITED");
    expect(err).toBeInstanceOf(Error);
  });
});
