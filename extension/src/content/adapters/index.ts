/**
 * ToneCraft extension — adapter registry.
 *
 * Single choke point: given a hostname, return the owning adapter. Site
 * adapters first, generic fallback last. Call sites never match hostnames.
 */
import type { SiteAdapter } from "./types";
import { genericAdapter } from "./generic";
import { SITE_ADAPTERS } from "./sites";
import { findEditableAncestor, isEditableElement } from "../editors";

export function adapterForHost(host: string): SiteAdapter {
  const h = (host || "").toLowerCase();
  for (const adapter of SITE_ADAPTERS) {
    try {
      if (adapter.matches(h)) return adapter;
    } catch {
      continue;
    }
  }
  return genericAdapter;
}

/**
 * Locate the best editor element: prefer the selection anchor's editable
 * ancestor, then adapter selectors (first editable, visible match).
 */
export function locateEditor(adapter: SiteAdapter, anchorEl: Element | null): HTMLElement | null {
  if (anchorEl) {
    const owned = findEditableAncestor(anchorEl);
    if (owned && isVisible(owned)) return owned;
  }
  try {
    for (const selector of adapter.editorSelectors) {
      const found = document.querySelector(selector);
      if (found instanceof HTMLElement && isEditableElement(found) && isVisible(found)) {
        return found;
      }
    }
  } catch {
    /* invalid selector — adapter bug, fall through */
  }
  return null;
}

function isVisible(el: HTMLElement): boolean {
  try {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  } catch {
    return true;
  }
}
