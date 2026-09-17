/**
 * ToneCraft extension — shared helpers for popup / side panel / options pages.
 *
 * These run in extension pages (trusted extension context, NOT the webpage),
 * so talking to the service worker and reading the active tab is safe here.
 */
import type { ExtensionResponse, SelectionContext, SubscriptionState } from "../shared/types";
import { newRequestId } from "../shared/validate";
import type { RecentToolEntry } from "../shared/storage";

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function sendWorker(message: unknown): Promise<ExtensionResponse> {
  return chrome.runtime.sendMessage(message) as Promise<ExtensionResponse>;
}

export async function fetchSession(): Promise<{ session: SubscriptionState; recent: RecentToolEntry[] } | null> {
  try {
    const res = await sendWorker({ type: "TC_SESSION_STATE", requestId: newRequestId() });
    if (!res.ok) return null;
    return res.data as { session: SubscriptionState; recent: RecentToolEntry[] };
  } catch {
    return null;
  }
}

export async function activeTabId(): Promise<number | null> {
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];
    if (!tab?.id || !tab.url) return null;
    if (/^(chrome|chrome-extension|edge|about|moz-extension|view-source|data|file):/i.test(tab.url)) return null;
    return tab.id;
  } catch {
    return null;
  }
}

/** Ask the content script of a tab for its live selection (null when absent). */
export async function tabSelection(tabId: number): Promise<SelectionContext | null> {
  try {
    const res = (await chrome.tabs.sendMessage(tabId, {
      type: "TC_GET_SELECTION",
      requestId: newRequestId(),
    })) as ExtensionResponse;
    if (!res || !res.ok) return null;
    return res.data as SelectionContext;
  } catch {
    return null;
  }
}

export async function generateViaWorker(payload: {
  toolId: string;
  input: string;
  tone?: string;
  language?: string;
  length?: "short" | "medium" | "long";
  instructions?: string;
  target: { tabId: number; frameId: number; editor: SelectionContext["editor"] } | null;
  host: string;
}): Promise<{ content: string } | { error: string; signIn: boolean }> {
  const requestId = newRequestId();
  try {
    const res = await sendWorker({ type: "TC_GENERATE", requestId, payload: { ...payload, requestId } });
    if (!res.ok) {
      return { error: res.error.message, signIn: res.error.code === "UNAUTHORIZED" };
    }
    const data = res.data as { content?: string };
    if (typeof data?.content !== "string" || !data.content) {
      return { error: "ToneCraft couldn't generate right now. Please retry.", signIn: false };
    }
    return { content: data.content };
  } catch {
    return { error: "ToneCraft needs an internet connection to generate.", signIn: false };
  }
}

export async function cancelViaWorker(requestId: string): Promise<void> {
  try {
    await sendWorker({ type: "TC_CANCEL", requestId });
  } catch {
    /* best-effort */
  }
}

export async function insertIntoTab(
  tabId: number,
  mode: "replace" | "insert",
  text: string,
  editor: NonNullable<SelectionContext["editor"]>,
): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "TC_INSERT",
      requestId: newRequestId(),
      payload: { mode, text, editor },
    });
    return true;
  } catch {
    return false;
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function openSite(path: string): void {
  void sendWorker({ type: "TC_OPEN_SITE", requestId: newRequestId(), payload: { path } }).catch(() => undefined);
}

export function openOptions(): void {
  void sendWorker({ type: "TC_OPEN_OPTIONS", requestId: newRequestId() }).catch(() => undefined);
}

export function usageLine(s: SubscriptionState): string {
  if (!s.signedIn) return "";
  if (s.unlimited) return `${s.planLabel} · unlimited`;
  const parts: string[] = [s.planLabel];
  if (s.dailyRemaining !== null && s.dailyAllocated !== null) {
    parts.push(`${s.dailyRemaining}/${s.dailyAllocated} today`);
  } else if (s.monthlyRemaining !== null && s.monthlyAllocated !== null) {
    parts.push(`${s.monthlyRemaining}/${s.monthlyAllocated} left`);
  }
  return parts.join(" · ");
}
