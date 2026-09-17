/**
 * ToneCraft extension — lightweight page observer (content script).
 *
 * One MutationObserver (childList only, throttled) watches for:
 *  - SPA navigations (URL change) → reset UI + saved ranges
 *  - editor removal → mark saved context stale
 *
 * Selection tracking uses the cheap `selectionchange` event, not polling.
 * Everything disconnects on pagehide. No continuous full-DOM scans.
 */
export interface ObserverCallbacks {
  onNavigate: () => void;
  onMutate: () => void;
}

export class PageObserver {
  private observer: MutationObserver | null = null;
  private lastUrl: string;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private cb: ObserverCallbacks | null = null;
  private disposed = false;

  constructor() {
    this.lastUrl = window.location.href;
  }

  start(cb: ObserverCallbacks): void {
    this.cb = cb;
    window.addEventListener("popstate", this.onUrlMaybe, true);
    window.addEventListener("hashchange", this.onUrlMaybe, true);
    document.addEventListener("pagehide", this.dispose, { once: true });
    try {
      this.observer = new MutationObserver(() => this.schedule());
      this.observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch {
      this.observer = null;
    }
  }

  private onUrlMaybe = (): void => {
    const href = window.location.href;
    if (href !== this.lastUrl) {
      this.lastUrl = href;
      this.cb?.onNavigate();
    }
  };

  private schedule(): void {
    this.onUrlMaybe();
    if (this.timer || this.disposed) return;
    // Batch rapid mutations (framework re-renders) into one callback.
    this.timer = setTimeout(() => {
      this.timer = null;
      if (!this.disposed) this.cb?.onMutate();
    }, 400);
  }

  dispose = (): void => {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    this.observer?.disconnect();
    this.observer = null;
    window.removeEventListener("popstate", this.onUrlMaybe, true);
    window.removeEventListener("hashchange", this.onUrlMaybe, true);
  };
}
