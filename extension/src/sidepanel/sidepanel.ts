/**
 * ToneCraft extension — side panel workspace.
 *
 * The power surface: live selection context, full tool list, tone / length /
 * language / instruction controls, compose templates, cancellable generation,
 * and replace/insert/copy back into the originating tab.
 */
import { t } from "../shared/strings";
import { EXTENSION_TOOLS, EXTENSION_TONES } from "../shared/constants";
import type { SelectionContext } from "../shared/types";
import {
  h,
  fetchSession,
  activeTabId,
  tabSelection,
  generateViaWorker,
  insertIntoTab,
  copyToClipboard,
  openSite,
  usageLine,
} from "../ui/uiCommon";

const main = document.getElementById("main") as HTMLElement;
const planEl = document.getElementById("plan") as HTMLElement;

let tabId: number | null = null;
let selection: SelectionContext | null = null;
let pickedTool = "rewrite";
let lastContent: string | null = null;

async function boot(): Promise<void> {
  const data = await fetchSession();
  if (!data || !data.session.signedIn) {
    planEl.textContent = t("auth.required.title");
    const wrap = h("div", "");
    wrap.appendChild(h("p", "", t("auth.required.body")));
    const btn = h("button", "tc-primary", t("auth.signIn"));
    btn.style.width = "100%";
    btn.addEventListener("click", () => openSite("/sign-in"));
    wrap.appendChild(btn);
    main.appendChild(wrap);
    return;
  }
  planEl.textContent = usageLine(data.session);

  tabId = await activeTabId();
  if (tabId !== null) selection = await tabSelection(tabId);
  renderWorkspace();
}

function renderWorkspace(): void {
  const selText = selection?.text.trim() ?? "";
  main.appendChild(h("div", "tc-label", "Selected text / context"));
  main.appendChild(h("div", "tc-sel", selText ? (selText.length > 600 ? `${selText.slice(0, 600)}…` : selText) : t("popup.noSelection")));

  main.appendChild(h("div", "tc-label", t("popup.quickActions")));
  const grid = h("div", "tc-grid");
  for (const tool of EXTENSION_TOOLS.filter((x) => x.supportsSelection)) {
    const b = h("button", "tc-tool");
    b.setAttribute("data-tool", tool.id);
    b.appendChild(h("b", "", tool.title));
    b.appendChild(h("span", "", tool.description));
    b.addEventListener("click", () => {
      pickedTool = tool.id;
      void runSelectionTool();
    });
    grid.appendChild(b);
  }
  main.appendChild(grid);

  // Options row.
  const opts = h("div", "tc-2col");
  const toneWrap = h("div", "");
  toneWrap.appendChild(h("div", "tc-label", t("gen.tone")));
  const tone = h("select", "tc-select") as HTMLSelectElement;
  for (const tn of EXTENSION_TONES) {
    const o = document.createElement("option");
    o.value = tn.id;
    o.textContent = tn.label;
    tone.appendChild(o);
  }
  toneWrap.appendChild(tone);
  const lenWrap = h("div", "");
  lenWrap.appendChild(h("div", "tc-label", t("gen.length")));
  const len = h("select", "tc-select") as HTMLSelectElement;
  for (const [v, label] of [["medium", "Medium"], ["short", "Short"], ["long", "Long"]] as const) {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = label;
    len.appendChild(o);
  }
  lenWrap.appendChild(len);
  opts.appendChild(toneWrap);
  opts.appendChild(lenWrap);
  main.appendChild(opts);

  main.appendChild(h("div", "tc-label", t("gen.language")));
  const lang = h("input", "tc-input") as HTMLInputElement;
  lang.placeholder = "English (leave blank for same language)";
  lang.maxLength = 60;
  main.appendChild(lang);

  main.appendChild(h("div", "tc-label", t("gen.instructions")));
  const extra = h("textarea", "tc-area") as HTMLTextAreaElement;
  extra.maxLength = 1500;
  extra.placeholder = "e.g. sound confident but friendly";
  main.appendChild(extra);

  const go = h("button", "tc-primary", t("gen.generate"));
  go.addEventListener("click", () => {
    pickedTool = (document.querySelector(".tc-tool[data-active='1']") as HTMLElement | null)?.dataset.tool ?? pickedTool;
    void runSelectionTool({ tone: tone.value, length: len.value as "short" | "medium" | "long", language: lang.value, instructions: extra.value });
  });
  main.appendChild(go);

  // Compose templates.
  main.appendChild(h("div", "tc-label", t("popup.compose")));
  const composeGrid = h("div", "tc-grid");
  for (const tool of EXTENSION_TOOLS.filter((x) => x.supportsEmptyEditor && !x.supportsSelection)) {
    const b = h("button", "tc-tool");
    b.appendChild(h("b", "", tool.title));
    b.appendChild(h("span", "", tool.description));
    b.addEventListener("click", () => void runComposeTool(tool.id, { tone: tone.value, language: lang.value, instructions: extra.value }));
    composeGrid.appendChild(b);
  }
  main.appendChild(composeGrid);

  main.appendChild(h("div", "tc-label", "Your idea"));
  const idea = h("textarea", "tc-area") as HTMLTextAreaElement;
  idea.id = "tc-idea";
  idea.maxLength = 4000;
  idea.placeholder = t("gen.writeIdea");
  main.appendChild(idea);
}

async function runSelectionTool(opts: { tone?: string; length?: "short" | "medium" | "long"; language?: string; instructions?: string } = {}): Promise<void> {
  const input = selection?.text.trim() ?? "";
  if (!input || tabId === null) return;
  await runGeneration(pickedTool, input, { tabId, frameId: 0, editor: selection?.editor ?? null }, opts);
}

async function runComposeTool(toolId: string, opts: { tone?: string; language?: string; instructions?: string }): Promise<void> {
  const idea = (document.getElementById("tc-idea") as HTMLTextAreaElement | null)?.value.trim() ?? "";
  if (!idea) return;
  await runGeneration(toolId, idea, null, opts);
}

async function runGeneration(
  toolId: string,
  input: string,
  target: { tabId: number; frameId: number; editor: SelectionContext["editor"] } | null,
  opts: { tone?: string; length?: "short" | "medium" | "long"; language?: string; instructions?: string },
): Promise<void> {
  clearOutcome();
  const status = h("div", "tc-sel", t("gen.generating"));
  status.id = "tc-outcome";
  main.appendChild(status);
  const outcome = await generateViaWorker({ toolId, input, target, host: "", ...stripEmpty(opts) });
  clearOutcome();
  if ("error" in outcome) {
    const box = h("div", "tc-err", outcome.error);
    box.id = "tc-outcome";
    box.setAttribute("role", "alert");
    main.appendChild(box);
    return;
  }
  lastContent = outcome.content;
  const label = h("div", "tc-label", "Result");
  label.id = "tc-outcome-label";
  const box = h("div", "tc-result", outcome.content);
  box.id = "tc-outcome";
  box.setAttribute("tabindex", "0");
  main.appendChild(label);
  main.appendChild(box);
  const row = h("div", "tc-row");
  row.id = "tc-outcome-row";
  if (target && selection?.inEditable && selection.editor && tabId !== null) {
    const editor = selection.editor;
    const tid = tabId;
    const replace = h("button", "tc-ghost", t("gen.replace"));
    replace.addEventListener("click", () => void (async () => {
      const ok = await insertIntoTab(tid, "replace", lastContent ?? "", editor);
      replace.textContent = ok ? t("gen.replaced") : t("gen.copied");
      if (!ok && lastContent) void copyToClipboard(lastContent);
    })());
    const insert = h("button", "tc-ghost", t("gen.insert"));
    insert.addEventListener("click", () => void (async () => {
      const ok = await insertIntoTab(tid, "insert", lastContent ?? "", editor);
      insert.textContent = ok ? t("gen.inserted") : t("gen.copied");
      if (!ok && lastContent) void copyToClipboard(lastContent);
    })());
    row.appendChild(replace);
    row.appendChild(insert);
  }
  const copy = h("button", "tc-ghost", t("gen.copy"));
  copy.addEventListener("click", () => void (async () => {
    if (lastContent) await copyToClipboard(lastContent);
    copy.textContent = t("gen.copied");
  })());
  row.appendChild(copy);
  main.appendChild(row);
}

function stripEmpty(o: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string" && v.trim()) out[k] = v;
  }
  return out;
}

function clearOutcome(): void {
  for (const id of ["tc-outcome", "tc-outcome-label", "tc-outcome-row"]) {
    document.getElementById(id)?.remove();
  }
}

void boot();
