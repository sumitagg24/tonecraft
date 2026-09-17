/**
 * ToneCraft extension — typed storage.
 *
 * Privacy rules enforced here:
 *  - `sync` (roams with the browser profile): preferences only.
 *  - `session` (memory-only, cleared on browser close): auth token, pending
 *    request metadata. Never persisted to disk by us.
 *  - `local`: recent-tool metadata (tool id + timestamp + char counts).
 *    NEVER raw selected/generated text.
 */
import { browserApi } from "./browserApi";
import { APP_URLS } from "./constants";

export interface ExtensionPrefs {
  baseUrl: string;
  defaultTone: string;
  floatingButton: boolean;
  contextMenu: boolean;
  onboardingDone: boolean;
}

const DEFAULT_PREFS: ExtensionPrefs = {
  baseUrl: APP_URLS.production,
  defaultTone: "professional",
  floatingButton: true,
  contextMenu: true,
  onboardingDone: false,
};

export async function getPrefs(): Promise<ExtensionPrefs> {
  try {
    const items = (await browserApi.storageSync.get(
      DEFAULT_PREFS as unknown as { [key: string]: unknown },
    )) as { [key: string]: unknown };
    return {
      baseUrl: normalizeBaseUrl(typeof items.baseUrl === "string" ? items.baseUrl : DEFAULT_PREFS.baseUrl),
      defaultTone: typeof items.defaultTone === "string" ? items.defaultTone : DEFAULT_PREFS.defaultTone,
      floatingButton: items.floatingButton !== false,
      contextMenu: items.contextMenu !== false,
      onboardingDone: items.onboardingDone === true,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function setPrefs(patch: Partial<ExtensionPrefs>): Promise<void> {
  const clean: Record<string, unknown> = {};
  if (patch.baseUrl !== undefined) clean.baseUrl = normalizeBaseUrl(patch.baseUrl);
  if (patch.defaultTone !== undefined) clean.defaultTone = String(patch.defaultTone).slice(0, 40);
  if (patch.floatingButton !== undefined) clean.floatingButton = !!patch.floatingButton;
  if (patch.contextMenu !== undefined) clean.contextMenu = !!patch.contextMenu;
  if (patch.onboardingDone !== undefined) clean.onboardingDone = !!patch.onboardingDone;
  await browserApi.storageSync.set(clean);
}

export function normalizeBaseUrl(value: string): string {
  const trimmed = (value || "").trim().replace(/\/+$/, "");
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return DEFAULT_PREFS.baseUrl;
    return url.origin + (url.pathname === "/" ? "" : url.pathname);
  } catch {
    return DEFAULT_PREFS.baseUrl;
  }
}

/** Auth token jar (memory-only). */
export const tokenJar = {
  KEY: "tc.sessionToken",
  get: () => browserApi.sessionStore.get<string>(tokenJar.KEY),
  set: (token: string) => browserApi.sessionStore.set(tokenJar.KEY, token),
  clear: () => browserApi.sessionStore.remove(tokenJar.KEY),
};

export interface RecentToolEntry {
  toolId: string;
  at: number;
  inputChars: number;
  outputChars: number;
}

const RECENT_KEY = "tc.recentTools";

export async function pushRecent(entry: RecentToolEntry): Promise<void> {
  try {
    const items = await browserApi.storageLocal.get(RECENT_KEY);
    const list = Array.isArray(items[RECENT_KEY]) ? (items[RECENT_KEY] as RecentToolEntry[]) : [];
    list.unshift({ toolId: entry.toolId, at: entry.at, inputChars: entry.inputChars, outputChars: entry.outputChars });
    await browserApi.storageLocal.set({ [RECENT_KEY]: list.slice(0, 8) });
  } catch {
    /* telemetry must never break generation */
  }
}

export async function getRecent(): Promise<RecentToolEntry[]> {
  try {
    const items = await browserApi.storageLocal.get(RECENT_KEY);
    const list = items[RECENT_KEY];
    return Array.isArray(list) ? (list as RecentToolEntry[]).filter((e) => typeof e?.toolId === "string") : [];
  } catch {
    return [];
  }
}
