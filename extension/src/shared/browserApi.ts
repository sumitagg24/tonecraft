/**
 * ToneCraft extension — browser API abstraction.
 *
 * All `chrome.*` access goes through this module so no file scatters raw
 * browser-namespace calls, and Firefox/Safari differences stay in one place.
 * Every method is promise-based and feature-detects before use.
 */

export const browserApi = {
  get runtime() {
    return chrome.runtime;
  },

  get storageSync() {
    return chrome.storage.sync;
  },

  get storageLocal() {
    return chrome.storage.local;
  },

  /** chrome.storage.session (memory-only); falls back to a Map when missing. */
  sessionStore: (() => {
    const memory = new Map<string, unknown>();
    const ext = typeof chrome !== "undefined" ? chrome : undefined;
    const hasSession = !!((ext?.storage ?? {}) as { session?: unknown }).session;
    return {
      async get<T>(key: string): Promise<T | undefined> {
        if (hasSession) {
          const items = await chrome.storage.session.get(key);
          return items[key] as T | undefined;
        }
        return memory.get(key) as T | undefined;
      },
      async set(key: string, value: unknown): Promise<void> {
        if (hasSession) {
          await chrome.storage.session.set({ [key]: value });
          return;
        }
        memory.set(key, value);
      },
      async remove(key: string): Promise<void> {
        if (hasSession) {
          await chrome.storage.session.remove(key);
          return;
        }
        memory.delete(key);
      },
    };
  })(),

  async getActiveTab(): Promise<chrome.tabs.Tab | null> {
    try {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      return tabs[0] ?? null;
    } catch {
      return null;
    }
  },

  async createTab(url: string): Promise<void> {
    await chrome.tabs.create({ url });
  },

  async sendTabMessage<T>(tabId: number, message: unknown): Promise<T> {
    return chrome.tabs.sendMessage(tabId, message) as Promise<T>;
  },

  async readSessionCookie(baseUrl: string, name: string): Promise<string | null> {
    try {
      if (!chrome.cookies?.get) return null;
      const cookie = await chrome.cookies.get({ url: baseUrl, name });
      return cookie?.value ?? null;
    } catch {
      return null;
    }
  },

  onInstalled(listener: (details: chrome.runtime.InstalledDetails) => void): void {
    chrome.runtime.onInstalled.addListener(listener);
  },

  onStartup(listener: () => void): void {
    try {
      chrome.runtime.onStartup.addListener(listener);
    } catch {
      /* Firefox Android and others may lack onStartup — menus rebuild lazily. */
    }
  },

  /** True for pages where extensions can never run (chrome://, store, …). */
  isRestrictedUrl(url: string | undefined): boolean {
    if (!url) return true;
    return /^(chrome|chrome-extension|edge|about|moz-extension|safari-web-extension|view-source|data|file):/i.test(url);
  },

  async openSidePanel(windowId?: number): Promise<boolean> {
    try {
      const sidePanel = (chrome as unknown as { sidePanel?: { open: (o: unknown) => Promise<void> } }).sidePanel;
      if (!sidePanel) return false;
      await sidePanel.open(windowId !== undefined ? { windowId } : {});
      return true;
    } catch {
      return false;
    }
  },
};
