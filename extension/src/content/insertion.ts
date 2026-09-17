/**
 * ToneCraft extension — result insertion engine.
 *
 * Priorities, in order:
 *  1. Preserve native undo (one undo step reverts our edit).
 *  2. Never destroy editor state (selection, formatting, framework models).
 *  3. Work generically; site adapters only patch real gaps.
 *
 * Technique:
 *  - textarea/input: select the target range, then
 *    document.execCommand("insertText") (undo-safe; setRangeText is only the
 *    fallback because Chromium gives it no undo entry) + synthetic `input`.
 *  - contenteditable/frameworks: restore the saved Range, then
 *    document.execCommand("insertText") — still the only path that flows
 *    through `beforeinput`, which ProseMirror/TipTap/Lexical/Slate/Draft/Quill
 *    all listen to. Manual DOM fallback when execCommand is unavailable.
 *
 * Generated text is ALWAYS inserted as plain text (never innerHTML) — AI
 * output is untrusted content and must not become executable markup.
 */
import type { EditorRef } from "../shared/types";
import { resolveEditor, isEditableElement } from "./editors";
import type { SiteAdapter } from "./adapters/types";

export type InsertMode = "replace" | "insert";

export interface SavedContext {
  editor: HTMLElement;
  range: Range | null;
}

/**
 * Restore a saved range into the live document. Returns false when the
 * editor or range is no longer viable (caller reports EDITOR_GONE).
 */
function restoreRange(ctx: SavedContext): boolean {
  if (!ctx.editor.isConnected) return false;
  try {
    ctx.editor.focus({ preventScroll: false });
  } catch {
    try {
      ctx.editor.focus();
    } catch {
      return false;
    }
  }
  const sel = window.getSelection();
  if (!sel) return false;
  try {
    sel.removeAllRanges();
    if (ctx.range) {
      // Re-validate the range endpoints are still attached before adding.
      const { startContainer, endContainer } = ctx.range;
      if (!startContainer.isConnected || !endContainer.isConnected) return false;
      sel.addRange(ctx.range.cloneRange());
    }
    return true;
  } catch {
    return false;
  }
}

function dispatchInput(el: HTMLElement): void {
  try {
    el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: false, composed: true }));
  } catch {
    try {
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } catch {
      /* non-critical */
    }
  }
}

function insertTextarea(el: HTMLTextAreaElement | HTMLInputElement, mode: InsertMode, text: string): boolean {
  try {
    el.focus();
    const caret = el.selectionStart ?? el.value.length;
    const start = caret;
    const end = mode === "replace" ? (el.selectionEnd ?? caret) : caret;
    try {
      el.setSelectionRange(start, end);
    } catch {
      return false;
    }
    // Primary path: execCommand("insertText") replaces the live selection
    // AND preserves the native undo stack. (setRangeText edits the value
    // directly without an undo entry in Chromium — it is only the fallback.)
    try {
      // eslint-disable-next-line deprecation/deprecation — see module note.
      if (document.execCommand("insertText", false, text)) {
        dispatchInput(el);
        return true;
      }
    } catch {
      /* fall through to setRangeText */
    }
    try {
      el.setRangeText(text, start, end, "end");
      dispatchInput(el);
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

function execInsertText(text: string): boolean {
  try {
    // eslint-disable-next-line deprecation/deprecation — execCommand insertText
    // is deprecated but remains the only undo-preserving programmatic edit
    // path that dispatches beforeinput for framework editors.
    return document.execCommand("insertText", false, text);
  } catch {
    return false;
  }
}

function manualContentEditableInsert(mode: InsertMode, text: string): boolean {
  try {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0).cloneRange();
    if (mode === "replace") range.deleteContents();
    else range.collapse(false);
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  } catch {
    return false;
  }
}

export function insertIntoEditor(
  ref: EditorRef,
  ctx: SavedContext | null,
  mode: InsertMode,
  text: string,
  adapter: SiteAdapter | null,
): void {
  const el = resolveEditor(ref.fingerprint);
  if (!el || !el.isConnected || !isEditableElement(el)) {
    throw new Error("EDITOR_GONE");
  }
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea" || tag === "input") {
    if (insertTextarea(el as HTMLTextAreaElement, mode, text)) {
      adapter?.afterInsert?.(el);
      return;
    }
    throw new Error("INSERT_FAILED");
  }

  const live: SavedContext = ctx && ctx.editor === el ? ctx : { editor: el, range: null };
  if (ctx && ctx.editor !== el) {
    // Stale context (editor re-mounted by the framework) — place at end.
    live.range = null;
  }
  if (live.range && !restoreRange(live)) {
    // Range died (framework re-render) — collapse to end and continue.
    try {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      const end = document.createRange();
      end.selectNodeContents(el);
      end.collapse(false);
      sel?.addRange(end);
    } catch {
      throw new Error("EDITOR_GONE");
    }
  } else if (!live.range) {
    try {
      el.focus();
    } catch {
      throw new Error("EDITOR_GONE");
    }
    if (mode === "replace") {
      // No saved range: select-all is WRONG (destroys user content intent).
      // Without a range we can only safely insert.
      mode = "insert";
    }
  }

  adapter?.beforeInsert?.(el, mode);
  const ok = execInsertText(text) || manualContentEditableInsert(mode, text);
  dispatchInput(el);
  adapter?.afterInsert?.(el);
  if (!ok) throw new Error("INSERT_FAILED");
}

/** Copy text to the clipboard from a content context (with fallback). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.documentElement.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
