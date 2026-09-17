/**
 * ToneCraft extension — runtime validation for the content<->worker protocol.
 *
 * The content script runs in a hostile environment (any webpage can forge
 * messages), so the service worker validates every inbound message before
 * acting. Validation is intentionally strict and allowlist-based.
 */
import type { ExtensionMessage, GenerateRequest } from "./types";
import { TOOL_BY_ID, LIMITS } from "./constants";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  return v.slice(0, max);
}

const MESSAGE_TYPES = new Set([
  "TC_GET_SELECTION",
  "TC_GENERATE",
  "TC_CANCEL",
  "TC_INSERT",
  "TC_COPY",
  "TC_SESSION_STATE",
  "TC_OPEN_OPTIONS",
  "TC_OPEN_SITE",
]);

export function validMessage(raw: unknown): raw is ExtensionMessage {
  if (!isRecord(raw)) return false;
  if (typeof raw.type !== "string" || !MESSAGE_TYPES.has(raw.type)) return false;
  if (typeof raw.requestId !== "string" || raw.requestId.length === 0 || raw.requestId.length > 64) return false;
  switch (raw.type) {
    case "TC_GENERATE":
      return validGenerateRequest(raw.payload);
    case "TC_INSERT": {
      if (!isRecord(raw.payload)) return false;
      const { mode, text, editor } = raw.payload;
      if (mode !== "replace" && mode !== "insert") return false;
      if (typeof text !== "string" || text.length === 0 || text.length > LIMITS.maxSelectionChars * 2) return false;
      return validEditorRef(editor);
    }
    case "TC_COPY": {
      if (!isRecord(raw.payload)) return false;
      const { text } = raw.payload;
      return typeof text === "string" && text.length > 0 && text.length <= LIMITS.maxSelectionChars * 2;
    }
    case "TC_OPEN_SITE": {
      if (!isRecord(raw.payload)) return false;
      const { path } = raw.payload;
      if (typeof path !== "string" || path.length > 200) return false;
      // Same-origin app paths only: absolute path, safe chars, no "..".
      if (!path.startsWith("/")) return false;
      if (path.includes("..") || path.includes("\\")) return false;
      return /^\/[a-zA-Z0-9/_?=&%.-]{0,199}$/.test(path);
    }
    default:
      return true;
  }
}

function validEditorRef(v: unknown): boolean {
  if (!isRecord(v)) return false;
  if (!["textarea", "input", "contenteditable", "unknown"].includes(v.kind as string)) return false;
  if (typeof v.fingerprint !== "string" || v.fingerprint.length === 0 || v.fingerprint.length > 512) return false;
  if (typeof v.host !== "string" || v.host.length > 253) return false;
  return true;
}

export function validGenerateRequest(raw: unknown): raw is GenerateRequest {
  if (!isRecord(raw)) return false;
  const tool = typeof raw.toolId === "string" ? TOOL_BY_ID[raw.toolId] : undefined;
  if (!tool) return false;
  if (typeof raw.requestId !== "string" || raw.requestId.length > 64) return false;
  if (typeof raw.input !== "string" || raw.input.trim().length === 0) return false;
  if (raw.input.length > LIMITS.maxSelectionChars) return false;
  if (raw.tone !== undefined && (typeof raw.tone !== "string" || raw.tone.length > 40)) return false;
  if (raw.language !== undefined && (typeof raw.language !== "string" || raw.language.length > 60)) return false;
  if (raw.length !== undefined && !["short", "medium", "long"].includes(raw.length as string)) return false;
  if (raw.instructions !== undefined) {
    if (typeof raw.instructions !== "string" || raw.instructions.length > LIMITS.maxInstructionsChars) return false;
  }
  if (raw.target !== null) {
    if (!isRecord(raw.target)) return false;
    if (typeof raw.target.tabId !== "number" || typeof raw.target.frameId !== "number") return false;
    if (raw.target.editor !== null && !validEditorRef(raw.target.editor)) return false;
  }
  if (typeof raw.host !== "string" || raw.host.length > 253) return false;
  return true;
}

/** Trim + clamp user text before it leaves the extension. */
export function sanitizeInput(text: string): string {
  return asString(text, LIMITS.maxSelectionChars)?.trim() ?? "";
}

/** New request id (counter + random; uniqueness per session is enough). */
let counter = 0;
export function newRequestId(): string {
  counter = (counter + 1) % 100000;
  return `r${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}
