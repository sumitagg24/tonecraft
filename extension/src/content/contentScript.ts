/**
 * ToneCraft extension — content script entry.
 *
 * Owns the page-side state machine: selection tracking (with saved Range for
 * later insertion), floating UI lifecycle, generation round-trips to the
 * service worker, and insertion back into the live editor.
 *
 * Concurrency: each generation carries a requestId; a newer selection hides
 * stale UI but in-flight results are applied only to a still-valid context.
 * Results are never routed across tabs — insertion always runs locally.
 */
import type {
  ExtensionResponse,
  GenerateResult,
  SelectionContext,
} from "../shared/types";
import { validMessage } from "../shared/validate";
import { newRequestId, sanitizeInput } from "../shared/validate";
import { TOOL_BY_ID } from "../shared/constants";
import { userMessage } from "../shared/errors";
import { captureSelection, textFieldSelection } from "./selection";
import { describeEditable, findEditableAncestor, isSensitiveElement } from "./editors";
import { copyText, insertIntoEditor, type SavedContext } from "./insertion";
import { adapterForHost } from "./adapters/index";
import { FloatingUI } from "./floatingUi";
import { PageObserver } from "./observer";
import { getPrefs } from "../shared/storage";

interface ActiveJob {
  requestId: string;
  toolId: string;
  toolTitle: string;
  input: string;
  ctx: SelectionContext;
  saved: SavedContext | null;
}

const ui = new FloatingUI();
let savedRange: Range | null = null;
let savedEditor: HTMLElement | null = null;
/** Textarea/input offsets — window Ranges don't cover form fields, and the
 *  live selection collapses as soon as panel buttons take focus. */
let savedTextRange: { start: number; end: number } | null = null;
/** Selection snapshot taken when the panel opened (clicks steal focus). */
let panelCtx: SelectionContext | null = null;
let activeJob: ActiveJob | null = null;
let lastResult: string | null = null;
let lastToolId = "";
let prefsCache = { floatingButton: true };

function pillRectFor(field: { element: HTMLElement } | null): DOMRect | null {
  try {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) return rect;
    }
    // Form-field selections have no window Range — anchor to the editor.
    if (field) return field.element.getBoundingClientRect();
    return null;
  } catch {
    return null;
  }
}

function trackSelection(): void {
  try {
    const field = textFieldSelection();
    const sel = window.getSelection();
    const hasWindowSel = !!sel && !sel.isCollapsed && (sel.toString() ?? "").trim().length > 0;

    if (field) {
      savedEditor = field.element;
      savedRange = null;
      savedTextRange = { start: field.start, end: field.end };
    } else if (hasWindowSel && sel) {
      const range = sel.getRangeAt(0);
      const container: Node = range.commonAncestorContainer;
      const el = container instanceof Element ? container : container.parentElement;
      // Never retain ranges inside sensitive fields.
      if (el) {
        const editable = findEditableAncestor(el);
        if (editable && isSensitiveElement(editable)) {
          savedRange = null;
          savedEditor = null;
          savedTextRange = null;
          ui.hideButton();
          return;
        }
        savedEditor = editable;
      }
      savedRange = range.cloneRange();
      savedTextRange = null;
    } else {
      savedRange = null;
      savedTextRange = null;
    }

    // Show the floating pill for non-trivial selections.
    const text = (field?.text ?? (hasWindowSel ? (sel?.toString() ?? "") : "")).trim();
    const rect = pillRectFor(field);
    if (text.length >= 3 && rect && prefsCache.floatingButton) {
      ui.showButton(rect);
    } else {
      ui.hideButton();
    }
  } catch {
    savedRange = null;
    savedTextRange = null;
  }
}

async function sendWorker<T>(message: unknown): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>;
}

function currentSavedContext(): SavedContext | null {
  if (!savedEditor || !savedEditor.isConnected) return null;
  return { editor: savedEditor, range: savedRange };
}

async function runTool(toolId: string, opts: { tone?: string; instructions?: string }): Promise<void> {
  const tool = TOOL_BY_ID[toolId];
  if (!tool) return;
  // Use the panel-open snapshot: clicking panel buttons steals focus and
  // collapses the live selection, so re-capturing here would see nothing.
  const ctx = panelCtx ?? captureSelection();
  const input = sanitizeInput(ctx.text);
  if (!input) {
    ui.setState({ kind: "error", message: "Select some text first, or use a compose template.", signIn: false });
    return;
  }
  const requestId = newRequestId();
  activeJob = { requestId, toolId, toolTitle: tool.title, input, ctx, saved: currentSavedContext() };
  lastToolId = toolId;
  ui.setState({ kind: "generating", toolTitle: tool.title });
  try {
    const res = await sendWorker<ExtensionResponse>({
      type: "TC_GENERATE",
      requestId,
      payload: {
        requestId,
        toolId,
        input,
        tone: opts.tone,
        instructions: opts.instructions,
        target: null,
        host: window.location.hostname,
      },
    });
    if (!res.ok) {
      const errCode = res.error.code;
      const signIn = errCode === "UNAUTHORIZED";
      ui.setState({ kind: "error", message: res.error.message, signIn });
      activeJob = null;
      return;
    }
    const result = (res.data ?? {}) as GenerateResult & { originTabId?: number };
    void result;
    // Guard: only apply if this is still the active job (no newer selection).
    if (!activeJob || activeJob.requestId !== requestId) return;
    lastResult = (res.data as GenerateResult).content;
    ui.setState({
      kind: "result",
      toolTitle: tool.title,
      content: lastResult,
      canReplace: !!(ctx.inEditable && input.length > 0),
    });
  } catch {
    if (activeJob?.requestId === requestId) {
      ui.setState({ kind: "error", message: userMessage("UNKNOWN"), signIn: false });
      activeJob = null;
    }
  }
}

async function doInsert(mode: "replace" | "insert"): Promise<void> {
  if (!activeJob || !lastResult) return;
  const adapter = adapterForHost(window.location.hostname);
  try {
    // Re-resolve the editor live; fall back to the focused editable element.
    let editorEl = savedEditor && savedEditor.isConnected ? savedEditor : null;
    if (!editorEl) {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        const found = findEditableAncestor(active);
        if (found && !isSensitiveElement(found)) editorEl = found;
      }
    }
    if (!editorEl || isSensitiveElement(editorEl)) {
      // Graceful degradation: copy + tell the user to paste.
      const snapshot = lastResult;
      if (snapshot) await copyText(snapshot).catch(() => false);
      ui.setState({ kind: "error", message: "Couldn't place the text here — it was copied. Paste it with Ctrl+V.", signIn: false });
      return;
    }
    // Restore form-field offsets collapsed by panel focus, then insert.
    if (
      savedTextRange &&
      (editorEl instanceof HTMLTextAreaElement || editorEl instanceof HTMLInputElement)
    ) {
      try {
        editorEl.setSelectionRange(savedTextRange.start, savedTextRange.end);
      } catch {
        /* fall through to caret insertion */
      }
    }
    insertIntoEditor(
      describeEditable(editorEl),
      activeJob.saved && activeJob.saved.editor === editorEl ? activeJob.saved : { editor: editorEl, range: savedRange },
      mode,
      lastResult,
      adapter,
    );
    ui.hideAll();
    activeJob = null;
    lastResult = null;
  } catch (err) {
    const gone = err instanceof Error && err.message === "EDITOR_GONE";
    const snapshot = lastResult;
    if (!gone && snapshot) {
      await copyText(snapshot).catch(() => false);
    }
    ui.setState({
      kind: "error",
      message: gone
        ? "The editor changed while generating. The result is ready to copy."
        : "Couldn't place the text in this editor — it was copied instead. Paste it with Ctrl+V.",
      signIn: false,
    });
  }
}

async function doCopy(): Promise<void> {
  if (!lastResult) return;
  await copyText(lastResult).catch(() => false);
  ui.hideAll();
}

function openSignIn(): void {
  void sendWorker({
    type: "TC_OPEN_SITE",
    requestId: newRequestId(),
    payload: { path: "/sign-in" },
  }).catch(() => undefined);
}

function onWorkerMessage(raw: unknown): void {
  if (!validMessage(raw)) return;
  if (raw.type === "TC_GET_SELECTION") {
    // Popup/sidepanel asking for the local context is handled via
    // sendMessage response below (see listener with sendResponse).
    return;
  }
  if (raw.type === "TC_GENERATE") {
    // Context-menu invocation from the worker: run with the live selection.
    const toolId = (raw as { payload?: { toolId?: string } }).payload?.toolId;
    if (typeof toolId === "string" && TOOL_BY_ID[toolId]) {
      panelCtx = captureSelection();
      ui.openPanel(panelCtx);
      void runTool(toolId, {});
    }
    return;
  }
  if (raw.type === "TC_INSERT") {
    const payload = (raw as { payload?: { mode?: string; text?: string } }).payload;
    if (payload && typeof payload.text === "string") {
      lastResult = payload.text;
      // Synthesize a job context so doInsert can work without a prior run.
      const ctx = captureSelection();
      activeJob = {
        requestId: newRequestId(),
        toolId: lastToolId || "rewrite",
        toolTitle: "ToneCraft",
        input: ctx.text,
        ctx,
        saved: currentSavedContext(),
      };
      void doInsert(payload.mode === "replace" ? "replace" : "insert");
    }
  }
}

function boot(): void {
  // Never run inside sensitive contexts or non-HTML documents.
  try {
    if (window.top !== window && window.frameElement) {
      // Nested frame: still allow, but the top frame owns the UI. Avoid
      // double UI by only tracking selection here when focused.
    }
    const prefs = getPrefs();
    void prefs.then((p) => {
      prefsCache = { floatingButton: p.floatingButton };
    });
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "sync" && changes.floatingButton) {
          prefsCache = { floatingButton: (changes.floatingButton.newValue as boolean) !== false };
          if (!prefsCache.floatingButton) ui.hideButton();
        }
      });
    } catch {
      /* non-critical */
    }

    ui.mount({
      onGenerate: (toolId, opts) => void runTool(toolId, opts),
      onOpenPanel: () => {
        // Snapshot while the page selection is still live (panel clicks
        // steal focus even with mousedown guards on some browsers).
        panelCtx = captureSelection();
        return panelCtx;
      },
      onCancel: () => {
        if (activeJob) {
          void sendWorker({ type: "TC_CANCEL", requestId: activeJob.requestId }).catch(() => undefined);
          activeJob = null;
        }
        ui.openPanel();
      },
      onInsert: (mode) => void doInsert(mode),
      onCopy: () => void doCopy(),
      onRetry: () => {
        if (lastToolId) void runTool(lastToolId, {});
        else ui.openPanel();
      },
      onClose: () => {
        activeJob = null;
      },
      onSignIn: () => openSignIn(),
    });

    document.addEventListener("selectionchange", () => {
      // Hide stale UI on new selections; the pill reappears via trackSelection.
      if (!window.getSelection()?.isCollapsed) ui.hidePanel();
      trackSelection();
    });
    document.addEventListener("scroll", () => ui.hideButton(), { passive: true, capture: true });

    chrome.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
      if (!validMessage(raw)) return false;
      if (raw.type === "TC_GET_SELECTION") {
        sendResponse({ ok: true, requestId: raw.requestId, data: captureSelection() });
        return false;
      }
      onWorkerMessage(raw);
      return false;
    });

    const observer = new PageObserver();
    observer.start({
      onNavigate: () => {
        ui.hideAll();
        savedRange = null;
        savedEditor = null;
        activeJob = null;
      },
      onMutate: () => {
        if (savedEditor && !savedEditor.isConnected) {
          savedEditor = null;
          savedRange = null;
        }
      },
    });
  } catch {
    /* content script must never break the host page */
  }
}

boot();
