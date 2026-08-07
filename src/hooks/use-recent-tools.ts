"use client";
import { useCallback, useSyncExternalStore } from "react";
import { tools, type ToolDefinition } from "@/components/tools/ToolDefinitions";
import {
  PINNED_TOOLS_KEY, RECENT_TOOLS_KEY,
  readList, recordRecentTool, togglePinnedTool,
} from "@/lib/recent-tools";

const listeners = new Set<() => void>();

// Cached snapshots: useSyncExternalStore requires a referentially stable
// getSnapshot result between renders, otherwise React re-renders forever.
// These caches are invalidated only when the underlying data actually changes.
let recentCache: string[] | null = null;
let pinnedCache: string[] | null = null;

function getRecentSnapshot(): string[] {
  if (recentCache === null) recentCache = readList(RECENT_TOOLS_KEY);
  return recentCache;
}

function getPinnedSnapshot(): string[] {
  if (pinnedCache === null) pinnedCache = readList(PINNED_TOOLS_KEY);
  return pinnedCache;
}

function invalidate() {
  recentCache = null;
  pinnedCache = null;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = () => {
    invalidate();
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function emit() {
  invalidate();
  listeners.forEach((cb) => cb());
}

function idsToTools(ids: string[]): ToolDefinition[] {
  const byId = new Map(tools.map((t) => [t.id, t]));
  return ids.map((id) => byId.get(id)).filter((t): t is ToolDefinition => Boolean(t));
}

/** Recently used tools (most recent first), persisted in localStorage. */
export function useRecentTools() {
  const ids = useSyncExternalStore(subscribe, getRecentSnapshot, () => []);

  const record = useCallback((toolId: string) => {
    recordRecentTool(toolId);
    emit();
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(RECENT_TOOLS_KEY);
    } catch {
      /* ignore */
    }
    emit();
  }, []);

  return { recentTools: idsToTools(ids), record, clear };
}

/** Pinned tools (persisted locally), with a toggle helper. */
export function usePinnedTools() {
  const ids = useSyncExternalStore(subscribe, getPinnedSnapshot, () => []);

  const toggle = useCallback((toolId: string) => {
    togglePinnedTool(toolId);
    emit();
  }, []);

  const isPinned = useCallback(
    (toolId: string) => getPinnedSnapshot().includes(toolId),
    []
  );

  return { pinnedTools: idsToTools(ids), toggle, isPinned };
}
