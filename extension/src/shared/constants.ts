/**
 * ToneCraft extension — constants, limits, and the extension tool registry.
 *
 * Every entry maps to a REAL backend capability (verified against
 * src/components/tools/ToolDefinitions.ts, src/app/api/tools/route.ts and
 * src/app/api/ai/assist/route.ts). The server re-validates toolId/action and
 * enforces auth + plan + rate limits — the registry only decides what the UI
 * offers, never what is permitted.
 */
import type { ExtensionTool } from "./types";

export const APP_URLS = {
  production: "https://www.tonecraft.site",
  fallback: "https://tonecraft.site",
  // NOTE: no localhost constant ships in the bundle (the store validator
  // rejects dev URLs in release output). Local development uses the options
  // page, which accepts any http(s) origin as an override.
} as const;

/** Client-side input caps (leave headroom under the server zod limits). */
export const LIMITS = {
  /** /api/tools input max is 10000; cap selection below it. */
  maxSelectionChars: 8000,
  /** /api/ai/assist `extra` max is 2000. */
  maxInstructionsChars: 1500,
  /** Popup compose box cap. */
  maxComposeChars: 4000,
  /** Recently-used list length (metadata only, never text). */
  maxRecentTools: 8,
} as const;

/** Tones with a direct server toolId (tools.<tone>-rewrite). */
export const EXTENSION_TONES: { id: string; label: string; toolId: string }[] = [
  { id: "professional", label: "Professional", toolId: "professional-rewrite" },
  { id: "friendly", label: "Friendly", toolId: "friendly-rewrite" },
  { id: "casual", label: "Casual", toolId: "casual-rewrite" },
  { id: "formal", label: "Formal", toolId: "formal-rewrite" },
  { id: "polite", label: "Polite", toolId: "polite-rewrite" },
  { id: "funny", label: "Funny", toolId: "funny-rewrite" },
  { id: "luxury", label: "Luxury", toolId: "luxury-rewrite" },
  { id: "corporate", label: "Corporate", toolId: "corporate-rewrite" },
];

/**
 * Quick actions (selection-first). `shorten` is implemented as
 * enhance+length:short — the server has no dedicated shorten op and the
 * length hint is an explicit, documented parameter of /api/tools.
 */
export const EXTENSION_TOOLS: ExtensionTool[] = [
  {
    id: "rewrite", title: "Rewrite", description: "Clearer, sharper, same meaning",
    supportsSelection: true, supportsEmptyEditor: false, needsTone: false, needsLanguage: false,
    backend: { kind: "assist", assistAction: "rewrite" },
  },
  {
    id: "improve", title: "Improve", description: "Clarity and impact",
    supportsSelection: true, supportsEmptyEditor: false, needsTone: false, needsLanguage: false,
    backend: { kind: "tools", toolId: "enhance" },
  },
  {
    id: "shorten", title: "Shorten", description: "Tighter, more concise",
    supportsSelection: true, supportsEmptyEditor: false, needsTone: false, needsLanguage: false,
    backend: { kind: "tools", toolId: "enhance", extra: { length: "short" } },
  },
  {
    id: "expand", title: "Expand", description: "Richer detail and examples",
    supportsSelection: true, supportsEmptyEditor: false, needsTone: false, needsLanguage: false,
    backend: { kind: "assist", assistAction: "expand" },
  },
  {
    id: "summarize", title: "Summarize", description: "Key points only",
    supportsSelection: true, supportsEmptyEditor: false, needsTone: false, needsLanguage: false,
    backend: { kind: "assist", assistAction: "summarize" },
  },
  {
    id: "grammar", title: "Fix grammar", description: "Correct errors, keep meaning",
    supportsSelection: true, supportsEmptyEditor: false, needsTone: false, needsLanguage: false,
    backend: { kind: "tools", toolId: "grammar-fix" },
  },
  {
    id: "tone", title: "Change tone", description: "Rewrite in the picked tone",
    supportsSelection: true, supportsEmptyEditor: false, needsTone: true, needsLanguage: false,
    backend: { kind: "assist", assistAction: "tone" },
  },
  {
    id: "translate", title: "Translate", description: "Translate, preserving tone",
    supportsSelection: true, supportsEmptyEditor: false, needsTone: false, needsLanguage: true,
    backend: { kind: "tools", toolId: "translate" },
  },
  {
    id: "continue", title: "Continue writing", description: "Pick up where the text ends",
    supportsSelection: true, supportsEmptyEditor: true, needsTone: false, needsLanguage: false,
    backend: { kind: "assist", assistAction: "continue" },
  },
  {
    id: "simplify", title: "Simplify", description: "Easier to understand",
    supportsSelection: true, supportsEmptyEditor: false, needsTone: false, needsLanguage: false,
    backend: { kind: "tools", toolId: "simplify" },
  },
  // Compose templates (empty-editor / popup-first; the idea is the input).
  {
    id: "compose-email", title: "Write email", description: "Professional email from an idea",
    supportsSelection: false, supportsEmptyEditor: true, needsTone: false, needsLanguage: false,
    backend: { kind: "tools", toolId: "email-writer" },
  },
  {
    id: "compose-linkedin", title: "Write LinkedIn post", description: "Engaging professional post",
    supportsSelection: false, supportsEmptyEditor: true, needsTone: false, needsLanguage: false,
    backend: { kind: "tools", toolId: "linkedin-post" },
  },
  {
    id: "compose-x", title: "Write X post", description: "Punchy post for X/Twitter",
    supportsSelection: false, supportsEmptyEditor: true, needsTone: false, needsLanguage: false,
    backend: { kind: "tools", toolId: "twitter-thread" },
  },
  {
    id: "compose-reply", title: "Write reply", description: "Polished reply from a few words",
    supportsSelection: false, supportsEmptyEditor: true, needsTone: false, needsLanguage: false,
    backend: { kind: "tools", toolId: "professional-reply" },
  },
];

export const TOOL_BY_ID: Record<string, ExtensionTool> = fromExtra(
  EXTENSION_TOOLS.map((t) => [t.id, t] as const),
);

/** Context-menu entries (subset — menus must stay uncluttered). */
export const CONTEXT_MENU_TOOLS = [
  "rewrite",
  "improve",
  "shorten",
  "expand",
  "grammar",
  "summarize",
] as const;

function fromExtra(_entries: readonly (readonly [string, ExtensionTool])[]): Record<string, ExtensionTool> {
  const out: Record<string, ExtensionTool> = {};
  for (const [k, v] of _entries) out[k] = v;
  return out;
}
