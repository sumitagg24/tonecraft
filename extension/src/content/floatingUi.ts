/**
 * ToneCraft extension — floating action UI (content script).
 *
 * Renders inside an OPEN Shadow Root so host-page CSS (global resets, button
 * styles, fonts, z-index wars) can neither break ToneCraft's UI nor be
 * affected by it. All classes are `.tc-` prefixed; AI output is rendered
 * with textContent only (never innerHTML).
 */
import { t } from "../shared/strings";
import { EXTENSION_TOOLS, EXTENSION_TONES } from "../shared/constants";
import type { SelectionContext } from "../shared/types";

export interface PanelCallbacks {
  onGenerate: (toolId: string, opts: { tone?: string; instructions?: string }) => void;
  onCancel: () => void;
  onInsert: (mode: "replace" | "insert") => void;
  onCopy: () => void;
  onRetry: () => void;
  onClose: () => void;
  onSignIn: () => void;
  /** Fired whenever the panel opens (snapshot the live selection here). */
  onOpenPanel: () => SelectionContext | null;
}

export type PanelState =
  | { kind: "tools" }
  | { kind: "generating"; toolTitle: string }
  | { kind: "result"; toolTitle: string; content: string; canReplace: boolean }
  | { kind: "error"; message: string; signIn: boolean };

const CSS = `
.tc-btn{all:initial;font:600 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;
background:#18111f;color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:999px;
padding:9px 14px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;
box-shadow:0 6px 24px rgba(0,0,0,.35);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif}
.tc-btn:hover{background:#241a2e}
.tc-btn:focus-visible{outline:2px solid #a855f7;outline-offset:2px}
.tc-spark{color:#c084fc;font-size:14px}
.tc-panel{all:initial;display:block;width:340px;max-width:calc(100vw - 24px);max-height:min(560px,calc(100vh - 24px));
overflow:auto;background:#16121d;color:#f3eefb;border:1px solid rgba(255,255,255,.12);border-radius:14px;
box-shadow:0 18px 60px rgba(0,0,0,.5);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;
font-size:13px;line-height:1.45}
@media (prefers-color-scheme:light){.tc-panel{background:#fff;color:#1c1526;border-color:rgba(0,0,0,.1)}}
.tc-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(128,128,128,.18)}
.tc-brand{display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px}
.tc-x{all:initial;cursor:pointer;color:inherit;opacity:.6;font-size:16px;padding:4px 8px;border-radius:8px;font-family:inherit}
.tc-x:hover{opacity:1;background:rgba(128,128,128,.15)}
.tc-x:focus-visible{outline:2px solid #a855f7}
.tc-body{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.tc-sel{font-size:12px;opacity:.75;background:rgba(128,128,128,.12);border-radius:8px;padding:8px 10px;
max-height:72px;overflow:hidden;text-overflow:ellipsis}
.tc-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tc-tool{all:initial;cursor:pointer;text-align:left;color:inherit;background:rgba(128,128,128,.12);
border:1px solid transparent;border-radius:10px;padding:9px 10px;font-family:inherit}
.tc-tool:hover{border-color:#a855f7;background:rgba(168,85,247,.12)}
.tc-tool:focus-visible{outline:2px solid #a855f7}
.tc-tool b{display:block;font-size:13px;font-weight:600}
.tc-tool span{font-size:11px;opacity:.7}
.tc-label{font-size:11px;font-weight:600;opacity:.75;text-transform:uppercase;letter-spacing:.04em}
.tc-select,.tc-input{all:initial;display:block;width:100%;box-sizing:border-box;color:inherit;
background:rgba(128,128,128,.12);border:1px solid rgba(128,128,128,.25);border-radius:8px;
padding:8px 10px;font-size:13px;font-family:inherit}
.tc-select:focus-visible,.tc-input:focus-visible{outline:2px solid #a855f7}
.tc-primary{all:initial;cursor:pointer;text-align:center;font-weight:700;font-size:13px;color:#fff;
background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:10px;padding:10px;font-family:inherit}
.tc-primary:hover{filter:brightness(1.1)}
.tc-primary:focus-visible{outline:2px solid #fff;outline-offset:2px}
.tc-primary:disabled{opacity:.6;cursor:wait}
.tc-row{display:flex;gap:8px}
.tc-ghost{all:initial;cursor:pointer;flex:1;text-align:center;color:inherit;font-size:12px;font-weight:600;
border:1px solid rgba(128,128,128,.3);border-radius:8px;padding:8px;font-family:inherit}
.tc-ghost:hover{background:rgba(128,128,128,.15)}
.tc-ghost:focus-visible{outline:2px solid #a855f7}
.tc-result{white-space:pre-wrap;background:rgba(128,128,128,.1);border-radius:8px;padding:10px;
max-height:220px;overflow:auto;font-size:13px}
.tc-err{background:rgba(220,38,38,.12);border:1px solid rgba(220,38,38,.4);border-radius:8px;
padding:10px;font-size:12px}
.tc-spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);
border-top-color:#fff;border-radius:50%;animation:tcspin .7s linear infinite;vertical-align:-2px}
@keyframes tcspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.tc-spin{animation:none}.tc-btn,.tc-panel{transition:none}}
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Keep the page's selection alive while interacting with the panel: a
 * mousedown default moves focus (collapsing window selections and form-field
 * carets), so action buttons suppress it. Selects/inputs are excluded — they
 * need native mousedown behavior.
 */
function keepSelection(button: HTMLElement): void {
  button.addEventListener("mousedown", (e) => e.preventDefault());
}

export class FloatingUI {
  private host: HTMLElement | null = null;
  private root: ShadowRoot | null = null;
  private button: HTMLButtonElement | null = null;
  private panel: HTMLElement | null = null;
  private ctx: SelectionContext | null = null;
  private state: PanelState = { kind: "tools" };
  private cb: PanelCallbacks | null = null;
  private activeTone = "professional";

  mount(cb: PanelCallbacks): void {
    this.cb = cb;
    if (this.host) return;
    const host = document.createElement("div");
    host.id = "tc-float-host";
    host.setAttribute("aria-hidden", "false");
    host.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;z-index:2147483646;";
    document.documentElement.appendChild(host);
    const root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = CSS;
    root.appendChild(style);
    this.host = host;
    this.root = root;
    document.addEventListener("keydown", this.onKey, true);
  }

  unmount(): void {
    document.removeEventListener("keydown", this.onKey, true);
    this.host?.remove();
    this.host = null;
    this.root = null;
    this.button = null;
    this.panel = null;
  }

  private onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      this.hidePanel();
      this.hideButton();
      this.cb?.onClose();
    }
  };

  hideButton(): void {
    this.button?.remove();
    this.button = null;
  }

  hidePanel(): void {
    this.panel?.remove();
    this.panel = null;
  }

  hideAll(): void {
    this.hideButton();
    this.hidePanel();
  }

  /** Show the pill near the selection rect (viewport-clamped). */
  showButton(rect: DOMRect): void {
    if (!this.root || this.panel) return;
    this.hideButton();
    const btn = el("button", "tc-btn");
    const spark = el("span", "tc-spark", "✦");
    spark.setAttribute("aria-hidden", "true");
    btn.appendChild(spark);
    btn.appendChild(document.createTextNode("ToneCraft"));
    btn.setAttribute("aria-label", "Open ToneCraft actions");
    btn.style.cssText = `position:fixed;left:${clamp(rect.left, 8, window.innerWidth - 140)}px;top:${clamp(rect.bottom + 8, 8, window.innerHeight - 48)}px;`;
    btn.addEventListener("mousedown", (e) => e.preventDefault()); // keep page selection
    btn.addEventListener("click", () => {
      this.hideButton();
      this.openPanel();
    });
    this.root.appendChild(btn);
    this.button = btn as HTMLButtonElement;
  }

  openPanel(ctx?: SelectionContext): void {
    if (!ctx) ctx = this.cb?.onOpenPanel() ?? undefined;
    if (ctx) this.ctx = ctx;
    this.hideButton();
    this.render({ kind: "tools" });
  }

  setState(state: PanelState): void {
    this.state = state;
    this.render(state);
  }

  private render(state: PanelState): void {
    if (!this.root) return;
    this.hidePanel();
    const panel = el("div", "tc-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "ToneCraft");

    const head = el("div", "tc-head");
    const brand = el("div", "tc-brand");
    const dot = el("span", "tc-spark", "✦");
    dot.setAttribute("aria-hidden", "true");
    brand.appendChild(dot);
    brand.appendChild(document.createTextNode(t("app.name")));
    const close = el("button", "tc-x", "×");
    close.setAttribute("aria-label", "Close ToneCraft panel");
    close.addEventListener("click", () => {
      this.hidePanel();
      this.cb?.onClose();
    });
    head.appendChild(brand);
    head.appendChild(close);
    panel.appendChild(head);

    const body = el("div", "tc-body");
    if (state.kind === "tools") this.renderTools(body);
    else if (state.kind === "generating") this.renderGenerating(body, state.toolTitle);
    else if (state.kind === "result") this.renderResult(body, state);
    else this.renderError(body, state.message, state.signIn);
    panel.appendChild(body);

    panel.style.cssText = `position:fixed;right:12px;top:${clamp(window.innerHeight - 580, 12, window.innerHeight - 200)}px;`;
    this.root.appendChild(panel);
    this.panel = panel;
    close.focus();
  }

  private renderTools(body: HTMLElement): void {
    const text = this.ctx?.text.trim() ?? "";
    if (text) {
      const preview = el("div", "tc-sel", text.length > 220 ? `${text.slice(0, 220)}…` : text);
      body.appendChild(preview);
    } else {
      const hint = el("div", "tc-sel", t("popup.noSelection"));
      body.appendChild(hint);
    }
    const label = el("div", "tc-label", t("popup.quickActions"));
    body.appendChild(label);
    const grid = el("div", "tc-grid");
    for (const tool of EXTENSION_TOOLS.filter((x) => x.supportsSelection)) {
      if (!text && !tool.supportsEmptyEditor) continue;
      const b = el("button", "tc-tool");
      b.setAttribute("data-tool", tool.id);
      keepSelection(b);
      const title = el("b", "", tool.title);
      const desc = el("span", "", tool.description);
      b.appendChild(title);
      b.appendChild(desc);
      b.addEventListener("click", () => this.startTool(tool.id));
      grid.appendChild(b);
    }
    body.appendChild(grid);

    // Tone picker (used by the "Change tone" tool + remembered default).
    const toneLabel = el("div", "tc-label", t("gen.tone"));
    body.appendChild(toneLabel);
    const select = document.createElement("select");
    select.className = "tc-select";
    select.setAttribute("aria-label", t("gen.tone"));
    for (const tone of EXTENSION_TONES) {
      const opt = document.createElement("option");
      opt.value = tone.id;
      opt.textContent = tone.label;
      if (tone.id === this.activeTone) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener("change", () => {
      this.activeTone = select.value;
    });
    body.appendChild(select);
  }

  private startTool(toolId: string): void {
    if (toolId === "tone") {
      this.cb?.onGenerate(toolId, { tone: this.activeTone });
    } else {
      this.cb?.onGenerate(toolId, {});
    }
  }

  private renderGenerating(body: HTMLElement, toolTitle: string): void {
    const row = el("div", "tc-sel");
    const spin = el("span", "tc-spin");
    spin.setAttribute("aria-hidden", "true");
    row.appendChild(spin);
    row.appendChild(document.createTextNode(` ${t("gen.generating")} ${toolTitle}`));
    body.appendChild(row);
    const cancel = el("button", "tc-ghost", t("gen.cancel"));
    keepSelection(cancel);
    cancel.addEventListener("click", () => this.cb?.onCancel());
    body.appendChild(cancel);
  }

  private renderResult(
    body: HTMLElement,
    state: { toolTitle: string; content: string; canReplace: boolean },
  ): void {
    const label = el("div", "tc-label", state.toolTitle);
    body.appendChild(label);
    const out = el("div", "tc-result", state.content);
    out.setAttribute("tabindex", "0");
    out.setAttribute("aria-label", "Generated result");
    body.appendChild(out);
    const row = el("div", "tc-row");
    if (state.canReplace) {
      const replace = el("button", "tc-ghost", t("gen.replace"));
      keepSelection(replace);
      replace.addEventListener("click", () => this.cb?.onInsert("replace"));
      row.appendChild(replace);
    }
    const insert = el("button", "tc-ghost", t("gen.insert"));
    keepSelection(insert);
    insert.addEventListener("click", () => this.cb?.onInsert("insert"));
    const copy = el("button", "tc-ghost", t("gen.copy"));
    keepSelection(copy);
    copy.addEventListener("click", () => this.cb?.onCopy());
    const retry = el("button", "tc-ghost", t("gen.retry"));
    keepSelection(retry);
    retry.addEventListener("click", () => this.cb?.onRetry());
    row.appendChild(insert);
    row.appendChild(copy);
    row.appendChild(retry);
    body.appendChild(row);
  }

  private renderError(body: HTMLElement, message: string, signIn: boolean): void {
    const box = el("div", "tc-err", message);
    box.setAttribute("role", "alert");
    body.appendChild(box);
    const row = el("div", "tc-row");
    if (signIn) {
      const sign = el("button", "tc-primary", t("auth.signIn"));
      keepSelection(sign);
      sign.addEventListener("click", () => this.cb?.onSignIn());
      body.appendChild(sign);
    } else {
      const retry = el("button", "tc-ghost", t("gen.retry"));
      keepSelection(retry);
      retry.addEventListener("click", () => this.cb?.onRetry());
      row.appendChild(retry);
    }
    const close = el("button", "tc-ghost", t("onboarding.skip"));
    close.textContent = "Close";
    keepSelection(close);
    close.addEventListener("click", () => {
      this.hidePanel();
      this.cb?.onClose();
    });
    row.appendChild(close);
    body.appendChild(row);
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), Math.max(min, max - 1));
}
