/**
 * ToneCraft extension — SiteAdapter interface.
 *
 * The GENERIC adapter handles the majority of websites. Site adapters exist
 * only where the generic strategy is unreliable (framework quirks, shadow
 * editors, aggressive re-renders). Call sites must never branch on hostnames
 * directly — they ask the registry for an adapter.
 */
import type { EditorRef } from "../../shared/types";
import type { InsertMode } from "../insertion";

export interface SiteAdapter {
  /** Stable id, e.g. "generic" | "gmail" | "linkedin". */
  id: string;
  /** True when this adapter owns the given hostname. */
  matches(host: string): boolean;
  /**
   * Extra CSS selectors (document scope) that locate this site's editors
   * when the generic ancestor walk fails. Ordered by reliability.
   */
  editorSelectors: string[];
  /** Hook before insertion (e.g. dismiss autocomplete popups). */
  beforeInsert?(editor: HTMLElement, mode: InsertMode): void;
  /** Hook after insertion (e.g. nudge framework observers). */
  afterInsert?(editor: HTMLElement): void;
  /** Human note for docs (which editor + why an adapter exists). */
  note: string;
}

/** Re-resolve helper re-export for adapter authors. */
export type { EditorRef };
export type { InsertMode };
