/**
 * ToneCraft extension — shared message + domain types.
 *
 * The content script runs in the untrusted webpage environment, the service
 * worker in the privileged extension environment, and the server is the only
 * trusted party. Every message crossing the content<->worker boundary is
 * validated at runtime (see ../shared/validate.ts) — never trust the sender.
 */

/** Backend capability backing an extension tool. */
export type BackendKind = "tools" | "assist";

export interface BackendMapping {
  kind: BackendKind;
  /** /api/tools toolId (must exist server-side; server re-validates). */
  toolId?: string;
  /** /api/ai/assist action. */
  assistAction?: "rewrite" | "summarize" | "expand" | "grammar" | "tone" | "continue";
  /** Fixed extra params (e.g. length:"short" for Shorten). */
  extra?: Record<string, string | number>;
}

/** One invocable capability in the extension tool registry. */
export interface ExtensionTool {
  id: string;
  title: string;
  description: string;
  /** Works on a text selection. */
  supportsSelection: boolean;
  /** Works with an empty editor (compose mode). */
  supportsEmptyEditor: boolean;
  /** Shows the tone picker for this tool. */
  needsTone: boolean;
  /** Shows the language input (translate). */
  needsLanguage: boolean;
  backend: BackendMapping;
}

/** Minimal editor target description (never ships DOM nodes across contexts). */
export interface EditorRef {
  kind: "textarea" | "input" | "contenteditable" | "unknown";
  /** Stable fingerprint to re-resolve the element later (same document). */
  fingerprint: string;
  /** Hostname of the page the editor lives on. */
  host: string;
}

/** What the user selected / where the caret is. Data-minimized by design. */
export interface SelectionContext {
  /** Selected text (capped client-side). Empty when caret-only. */
  text: string;
  /** True when the selection/caret is inside an editable element. */
  inEditable: boolean;
  editor: EditorRef | null;
  host: string;
  pageTitle: string;
}

/** A generation request issued from any UI surface. */
export interface GenerateRequest {
  requestId: string;
  toolId: string;
  input: string;
  tone?: string;
  language?: string;
  length?: "short" | "medium" | "long";
  instructions?: string;
  /** Where to insert the result (resolved in the originating tab). */
  target: { tabId: number; frameId: number; editor: EditorRef | null } | null;
  host: string;
}

export interface GenerateResult {
  requestId: string;
  toolId: string;
  content: string;
  /** True when the result came from server cache/fallback (reserved). */
  cached?: boolean;
}

/** Typed content<->worker protocol. `requestId` correlates async work. */
export type ExtensionMessage =
  | { type: "TC_GET_SELECTION"; requestId: string }
  | { type: "TC_GENERATE"; requestId: string; payload: GenerateRequest }
  | { type: "TC_CANCEL"; requestId: string }
  | { type: "TC_INSERT"; requestId: string; payload: { mode: "replace" | "insert"; text: string; editor: EditorRef } }
  | { type: "TC_COPY"; requestId: string; payload: { text: string } }
  | { type: "TC_SESSION_STATE"; requestId: string }
  | { type: "TC_OPEN_OPTIONS"; requestId: string }
  | { type: "TC_OPEN_SITE"; requestId: string; payload: { path: string } };

export type ExtensionResponse =
  | { ok: true; requestId: string; data?: unknown }
  | { ok: false; requestId: string; error: { code: string; message: string; details?: unknown } };

/** Server envelope (mirrors src/lib/withApiHandler.ts). */
export type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

export interface SubscriptionState {
  signedIn: boolean;
  plan: string;
  planLabel: string;
  dailyRemaining: number | null;
  dailyAllocated: number | null;
  monthlyRemaining: number | null;
  monthlyAllocated: number | null;
  unlimited: boolean;
}

export type MessageSender = chrome.runtime.MessageSender;
