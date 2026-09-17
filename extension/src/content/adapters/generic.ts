/**
 * ToneCraft extension — generic site adapter (default for the whole web).
 *
 * Handles plain textareas/inputs, native contenteditable, and the common
 * framework editors (they are all contenteditable under the hood) via the
 * shared insertion engine, which flows through beforeinput so frameworks
 * stay in sync.
 */
import type { SiteAdapter } from "./types";

export const genericAdapter: SiteAdapter = {
  id: "generic",
  matches: () => true,
  editorSelectors: [
    'textarea:not([disabled]):not([readonly])',
    'input[type="text"]:not([disabled]):not([readonly])',
    'input[type="search"]:not([disabled]):not([readonly])',
    'input[type="email"]:not([disabled]):not([readonly])',
    '[contenteditable="true"]',
    '[contenteditable=""]',
    '[role="textbox"]',
    // Framework editors (all contenteditable-backed).
    ".ProseMirror",
    ".tiptap.ProseMirror",
    ".DraftEditor-root",
    '[data-lexical-editor="true"]',
    '[data-slate-editor="true"]',
    ".ql-editor",
    ".CodeMirror-code",
  ],
  note: "Default adapter: native + framework contenteditable via beforeinput-compatible insertion.",
};
