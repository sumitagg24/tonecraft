/**
 * ToneCraft extension — selection capture (content script).
 *
 * Data-minimizing by design: captures ONLY the current selection text (capped)
 * plus the editable context needed to insert a result. Never the full page,
 * never surrounding paragraphs, never password/payment fields.
 *
 * NOTE: textarea/input selections are NOT part of window.getSelection() —
 * they must be read from selectionStart/selectionEnd explicitly.
 */
import type { EditorRef, SelectionContext } from "../shared/types";
import { LIMITS } from "../shared/constants";
import { describeEditable, findEditableAncestor, isSensitiveElement } from "./editors";

export interface TextFieldSelection {
  element: HTMLTextAreaElement | HTMLInputElement;
  text: string;
  start: number;
  end: number;
}

/** Selection inside a focused textarea/text input (null when none). */
export function textFieldSelection(): TextFieldSelection | null {
  try {
    const el = document.activeElement;
    if (!(el instanceof HTMLTextAreaElement) && !(el instanceof HTMLInputElement)) return null;
    if (isSensitiveElement(el)) return null;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === null || end === null || end <= start) return null;
    const text = el.value.slice(start, end).slice(0, LIMITS.maxSelectionChars);
    if (!text.trim()) return null;
    return { element: el, text, start, end };
  } catch {
    return null;
  }
}

function windowSelectionText(): string {
  try {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return "";
    return (sel.toString() ?? "").slice(0, LIMITS.maxSelectionChars);
  } catch {
    return "";
  }
}

/** Caret context inside an editor when nothing is selected (compose mode). */
function caretEditor(): EditorRef | null {
  try {
    const el = document.activeElement;
    if (!el || !(el instanceof HTMLElement)) return null;
    if (isSensitiveElement(el)) return null;
    return describeEditable(el);
  } catch {
    return null;
  }
}

export function captureSelection(): SelectionContext {
  const host = window.location.hostname;
  let pageTitle = "";
  try {
    pageTitle = document.title.slice(0, 120);
  } catch {
    pageTitle = "";
  }

  const field = textFieldSelection();
  const text = windowSelectionText() || field?.text || "";
  if (text.trim()) {
    let editor: EditorRef | null = null;
    let inEditable = false;
    try {
      if (field && !isSensitiveElement(field.element)) {
        editor = describeEditable(field.element);
        inEditable = true;
      } else {
        const sel = window.getSelection();
        const anchor = sel?.anchorNode;
        const anchorEl = anchor instanceof Element ? anchor : anchor?.parentElement ?? null;
        const editable = anchorEl ? findEditableAncestor(anchorEl) : null;
        if (editable && !isSensitiveElement(editable)) {
          editor = describeEditable(editable);
          inEditable = true;
        }
      }
    } catch {
      editor = null;
    }
    return { text, inEditable, editor, host, pageTitle };
  }

  // No selection — report the focused editor (if any) for compose mode.
  const editor = caretEditor();
  return { text: "", inEditable: !!editor, editor, host, pageTitle };
}
