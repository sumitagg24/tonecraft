/**
 * Recently-used & pinned tool persistence.
 *
 * Pure helpers (no DOM access) so they are unit-testable; the hooks in
 * `use-recent-tools.ts` wrap them with localStorage + useSyncExternalStore.
 */

export const RECENT_TOOLS_KEY = "tc:recent-tools";
export const PINNED_TOOLS_KEY = "tc:pinned-tools";
export const MAX_RECENT_TOOLS = 8;

/** Push an id to the front of a list, dedupe, cap at `max`. Pure. */
export function pushRecent(list: string[], id: string, max = MAX_RECENT_TOOLS): string[] {
  return [id, ...list.filter((x) => x !== id)].slice(0, max);
}

/** Toggle an id in a pinned list. Pure. */
export function togglePin(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];
}

/** Read a string id list from localStorage (SSR-safe). */
export function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Write a string id list to localStorage. */
export function writeList(key: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* storage unavailable */
  }
}

/** Record a tool use: returns the updated recent list and persists it. */
export function recordRecentTool(id: string): string[] {
  const next = pushRecent(readList(RECENT_TOOLS_KEY), id);
  writeList(RECENT_TOOLS_KEY, next);
  return next;
}

/** Toggle a pinned tool: returns the updated pinned list and persists it. */
export function togglePinnedTool(id: string): string[] {
  const next = togglePin(readList(PINNED_TOOLS_KEY), id);
  writeList(PINNED_TOOLS_KEY, next);
  return next;
}
