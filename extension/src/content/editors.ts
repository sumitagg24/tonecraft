/**
 * ToneCraft extension — editable-element detection + resolution.
 *
 * Detects textarea / text inputs / contenteditable (including framework
 * editors built on contenteditable: ProseMirror, TipTap, Draft.js, Lexical,
 * Slate, Quill) and role=textbox composites. Sensitive fields are excluded
 * everywhere: password, payment, OTP and similar inputs are never described,
 * read, or written.
 */

export type EditableKind = "textarea" | "input" | "contenteditable" | "unknown";

const TEXT_INPUT_TYPES = new Set([
  "text", "search", "url", "tel", "email", "number",
  // NOTE: "password" deliberately absent — never touch password fields.
]);

const SENSITIVE_INPUT_TYPES = new Set([
  "password", "hidden", "file", "checkbox", "radio", "submit", "button",
  "image", "reset", "color", "range",
]);

const SENSITIVE_AUTOCOMPLETE = new Set([
  "cc-number", "cc-exp", "cc-exp-month", "cc-exp-year", "cc-csc", "cc-cvv",
  "cc-name", "cc-family-name", "cc-given-name",
  "current-password", "new-password", "one-time-code", "otp",
]);

const SENSITIVE_LABEL = /(password|passwd|credit[\s-]?card|card[\s-]?number|cvv|cvc|security[\s-]?code|ssn|social[\s-]?security|pin[\s-]?code|otp|one[\s-]?time)/i;

/**
 * True when the element must never be read from or written to. Conservative:
 * unknown input types are treated as sensitive.
 */
export function isSensitiveElement(el: Element | null | undefined): boolean {
  if (!el || !(el instanceof HTMLElement)) return true;
  const tag = el.tagName.toLowerCase();
  if (tag === "input") {
    const type = ((el as HTMLInputElement).type || "text").toLowerCase();
    if (SENSITIVE_INPUT_TYPES.has(type)) return true;
    if (!TEXT_INPUT_TYPES.has(type)) return true; // unknown type → skip
    const autocomplete = (el.getAttribute("autocomplete") || "").toLowerCase().trim();
    if (autocomplete && SENSITIVE_AUTOCOMPLETE.has(autocomplete)) return true;
    if (el.hasAttribute("data-tc-sensitive")) return true;
    const label = `${el.getAttribute("aria-label") ?? ""} ${el.getAttribute("name") ?? ""} ${el.getAttribute("id") ?? ""}`;
    if (SENSITIVE_LABEL.test(label)) return true;
    return false;
  }
  if (tag === "textarea" || el.isContentEditable) {
    const label = `${el.getAttribute("aria-label") ?? ""} ${el.getAttribute("name") ?? ""} ${el.getAttribute("id") ?? ""} ${el.getAttribute("data-testid") ?? ""}`;
    if (SENSITIVE_LABEL.test(label)) return true;
    return false;
  }
  return true; // non-editable elements are "sensitive" (never targets)
}

export function isEditableElement(el: Element | null | undefined): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (isSensitiveElement(el)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea") return !(el as HTMLTextAreaElement).disabled && !(el as HTMLTextAreaElement).readOnly;
  if (tag === "input") return !(el as HTMLInputElement).disabled && !(el as HTMLInputElement).readOnly;
  if (el.isContentEditable) return true;
  if (el.getAttribute("role") === "textbox") return true;
  return false;
}

/** Nearest editable ancestor (or self) of a node inside the page. */
export function findEditableAncestor(start: Element | null): HTMLElement | null {
  let el: Element | null = start;
  let depth = 0;
  while (el && depth < 12) {
    if (el instanceof HTMLElement && isEditableElement(el)) return el;
    el = el.parentElement;
    depth += 1;
  }
  return null;
}

export interface EditorFingerprint {
  tag: string;
  id?: string;
  name?: string;
  role?: string;
  ariaLabel?: string;
  testId?: string;
  /** Positional path as a fallback (capped depth). */
  path?: number[];
}

export function describeEditable(el: HTMLElement): import("../shared/types").EditorRef {
  const tag = el.tagName.toLowerCase();
  const kind: EditableKind =
    tag === "textarea" ? "textarea" : tag === "input" ? "input" : el.isContentEditable || el.getAttribute("role") === "textbox" ? "contenteditable" : "unknown";
  const fp: EditorFingerprint = { tag };
  const id = el.getAttribute("id");
  if (id) fp.id = id.slice(0, 120);
  const name = el.getAttribute("name");
  if (name) fp.name = name.slice(0, 120);
  const role = el.getAttribute("role");
  if (role) fp.role = role.slice(0, 40);
  const aria = el.getAttribute("aria-label");
  if (aria) fp.ariaLabel = aria.slice(0, 120);
  const testId = el.getAttribute("data-testid");
  if (testId) fp.testId = testId.slice(0, 120);
  if (!fp.id) fp.path = elementPath(el, 8);
  let host = "";
  try {
    host = window.location.hostname;
  } catch {
    host = "";
  }
  return { kind, fingerprint: JSON.stringify(fp), host };
}

/** Re-resolve a previously fingerprinted editor in the live DOM. */
export function resolveEditor(fingerprint: string): HTMLElement | null {
  let fp: EditorFingerprint;
  try {
    fp = JSON.parse(fingerprint) as EditorFingerprint;
    if (!fp || typeof fp.tag !== "string") return null;
  } catch {
    return null;
  }
  try {
    if (fp.id) {
      const byId = document.getElementById(fp.id);
      if (byId instanceof HTMLElement && isEditableElement(byId)) return byId;
    }
    // Best-effort fallbacks: name / testid / positional path.
    if (fp.name) {
      const byName = document.querySelector(`${fp.tag}[name="${cssEscape(fp.name)}"]`);
      if (byName instanceof HTMLElement && isEditableElement(byName)) return byName;
    }
    if (fp.testId) {
      const byTestId = document.querySelector(`[data-testid="${cssEscape(fp.testId)}"]`);
      if (byTestId instanceof HTMLElement && isEditableElement(byTestId)) return byTestId;
    }
    if (fp.path) {
      const byPath = elementByPath(fp.path);
      if (byPath instanceof HTMLElement && isEditableElement(byPath)) return byPath;
    }
    return null;
  } catch {
    return null;
  }
}

function cssEscape(value: string): string {
  try {
    return CSS.escape(value);
  } catch {
    return value.replace(/["\\]/g, "");
  }
}

function elementPath(el: Element, maxDepth: number): number[] {
  const path: number[] = [];
  let node: Element | null = el;
  while (node && node !== document.documentElement && path.length < maxDepth) {
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    path.unshift(Array.prototype.indexOf.call(parent.children, node));
    node = parent;
  }
  return path;
}

function elementByPath(path: number[]): Element | null {
  let node: Element | null = document.documentElement;
  for (const index of path) {
    if (!node || index < 0 || index >= node.children.length) return null;
    node = node.children[index];
  }
  return node;
}
