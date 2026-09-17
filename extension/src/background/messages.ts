/**
 * ToneCraft extension — service-worker message router.
 *
 * Handles messages from content scripts, popup, and side panel. Every inbound
 * message is validated (validate.ts) before use. Generation is tracked per
 * requestId so any surface can cancel its own request without touching
 * another tab's work (concurrency isolation).
 *
 * Error serialization rule: only {code, message} cross the boundary — never
 * raw payloads, tokens, or page text beyond what the caller already holds.
 */
import { validMessage } from "../shared/validate";
import type { ExtensionMessage, ExtensionResponse } from "../shared/types";
import { ExtensionError, userMessage } from "../shared/errors";
import { apiClient } from "./apiClient";
import { generate } from "./generation";
import { getSessionState, invalidateSessionCache } from "./session";
import { getRecent, getPrefs } from "../shared/storage";
import { browserApi } from "../shared/browserApi";

function fail(requestId: string, err: unknown): ExtensionResponse {
  if (err instanceof ExtensionError) {
    return { ok: false, requestId, error: { code: err.code, message: userMessage(err.code), details: err.serverCode } };
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return { ok: false, requestId, error: { code: "CANCELLED", message: "Cancelled." } };
  }
  return { ok: false, requestId, error: { code: "UNKNOWN", message: userMessage("UNKNOWN") } };
}

export function wireMessages(): void {
  chrome.runtime.onMessage.addListener((raw, sender, sendResponse) => {
    void handleMessage(raw, sender).then(sendResponse);
    return true; // async response
  });

  // External pages (the ToneCraft site) cannot message us unless declared in
  // externally_connectable — we declare nothing, so this stays closed.
}

async function handleMessage(raw: unknown, sender: chrome.runtime.MessageSender): Promise<ExtensionResponse> {
  if (!validMessage(raw)) {
    return { ok: false, requestId: "invalid", error: { code: "BAD_INPUT", message: userMessage("BAD_INPUT") } };
  }
  const message = raw as ExtensionMessage;
  const requestId = message.requestId;
  try {
    switch (message.type) {
      case "TC_GENERATE": {
        const controller = new AbortController();
        apiClient.track(message.requestId, controller);
        try {
          const result = await generate(message.payload, controller.signal);
          // Stamp the originating tab so insertion can be routed back even
          // if the caller didn't know its own tab id.
          if (!result) throw new ExtensionError("SERVER");
          return {
            ok: true,
            requestId: message.requestId,
            data: { ...result, originTabId: sender.tab?.id ?? null, originFrameId: sender.frameId ?? 0 },
          };
        } finally {
          apiClient.untrack(message.requestId);
        }
      }
      case "TC_CANCEL": {
        apiClient.cancel(message.requestId);
        return { ok: true, requestId: message.requestId };
      }
      case "TC_SESSION_STATE": {
        const state = await getSessionState().catch((err: unknown) => {
          if (err instanceof ExtensionError) {
            throw err;
          }
          throw new ExtensionError("OFFLINE");
        });
        const recent = await getRecent();
        return { ok: true, requestId: message.requestId, data: { session: state, recent } };
      }
      case "TC_COPY": {
        // Copy executes in the worker via the Clipboard API when available;
        // callers fall back to document.execCommand in their own context.
        return { ok: true, requestId: message.requestId };
      }
      case "TC_INSERT": {
        // Insertion always runs in the tab that owns the editor.
        const editor = message.payload.editor;
        void editor;
        return { ok: true, requestId: message.requestId };
      }
      case "TC_OPEN_OPTIONS": {
        await chrome.runtime.openOptionsPage().catch(() => undefined);
        return { ok: true, requestId: message.requestId };
      }
      case "TC_OPEN_SITE": {
        const prefs = await getPrefs();
        const path = message.type === "TC_OPEN_SITE" && typeof (message as { payload?: { path?: string } }).payload?.path === "string"
          ? (message as { payload: { path: string } }).payload.path
          : "/";
        await browserApi.createTab(`${prefs.baseUrl}${path}`);
        return { ok: true, requestId: message.requestId };
      }
      case "TC_GET_SELECTION": {
        // Answered by content scripts, not the worker — but validate+ack here
        // so popup callers get a clean "no content script" signal instead.
        return { ok: false, requestId: message.requestId, error: { code: "NO_CONTENT", message: "No page context." } };
      }
    }
    return { ok: false, requestId, error: { code: "BAD_INPUT", message: userMessage("BAD_INPUT") } };
  } catch (err) {
    if (err instanceof ExtensionError && err.code === "UNAUTHORIZED") invalidateSessionCache();
    return fail(message.requestId, err);
  }
}
