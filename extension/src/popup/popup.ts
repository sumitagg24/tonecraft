/**
 * ToneCraft extension — popup controller.
 *
 * Real functionality, not a redirect: shows plan/usage, reads the active
 * tab's live selection via its content script, runs generations through the
 * service worker, and offers replace/insert/copy back into the page.
 */
import { t } from "../shared/strings";
import { EXTENSION_TOOLS } from "../shared/constants";
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
  openOptions,
  usageLine,
} from "../ui/uiCommon";

const main = document.getElementById("main") as HTMLElement;
const planEl = document.getElementById("plan") as HTMLElement;

let tabId: number | null = null;
let selection: SelectionContext | null = null;
let lastContent: string | null = null;

function signInView(): void {
  planEl.textContent = t("auth.required.title");
  main.replaceChildren();
  const wrap = h("div", "tc-signin");
  wrap.appendChild(h("p", "", t("auth.required.body")));
  const btn = h("button", "tc-primary", t("auth.signIn"));
  btn.addEventListener("click", () => openSite("/sign-in"));
  wrap.appendChild(btn);
  const hint = h("p", "tc-recent", "Sign in on tonecraft.site in this browser profile — the extension uses the same account.");
  wrap.appendChild(hint);
  main.appendChild(wrap);
}

async function boot(): Promise<void> {
  const data = await fetchSession();
  if (!data || !data.session.signedIn) {
    signInView();
    return;
  }
  planEl.textContent = usageLine(data.session);

  tabId = await activeTabId();
  if (tabId !== null) selection = await tabSelection(tabId);

  const selText = selection?.text.trim() ?? "";

  // Selection preview (or compose hint).
  if (selText) {
    main.appendChild(h("div", "tc-sel", selText.length > 200 ? `${selText.slice(0, 200)}…` : selText));
  } else {
    main.appendChild(h("div", "tc-sel", t("popup.noSelection")));
  }

  // Quick actions.
  main.appendChild(h("div", "tc-label", t("popup.quickActions")));
  const grid = h("div", "tc-grid");
  for (const tool of EXTENSION_TOOLS.filter((x) => x.supportsSelection)) {
    const b = h("button", "tc-tool");
    b.setAttribute("data-tool", tool.id);
    b.appendChild(h("b", "", tool.title));
    b.appendChild(h("span", "", tool.description));
    b.addEventListener("click", () => void runQuick(tool.id));
    grid.appendChild(b);
  }
  main.appendChild(grid);

  // Compose box.
  main.appendChild(h("div", "tc-label", t("popup.compose")));
  const area = h("textarea", "tc-area") as HTMLTextAreaElement;
  area.placeholder = t("gen.writeIdea");
  area.maxLength = 4000;
  area.setAttribute("aria-label", t("gen.writeIdea"));
  main.appendChild(area);
  const genBtn = h("button", "tc-primary", t("gen.generate"));
  genBtn.addEventListener("click", () => void runCompose(area.value));
  main.appendChild(genBtn);

  if (data.recent.length > 0) {
    main.appendChild(h("div", "tc-label", t("popup.recent")));
    const recent = h("div", "tc-recent", data.recent.map((r) => r.toolId).slice(0, 5).join(" · "));
    main.appendChild(recent);
  }
}

async function runQuick(toolId: string): Promise<void> {
  const input = selection?.text.trim() ?? "";
  if (!input || tabId === null) return;
  await runGeneration(toolId, input, {
    tabId,
    frameId: 0,
    editor: selection?.editor ?? null,
  });
}

async function runCompose(idea: string): Promise<void> {
  const input = idea.trim();
  if (!input) return;
  // Compose uses the email template by default (idea → full email); the side
  // panel offers the other templates.
  await runGeneration("compose-email", input, null);
}

async function runGeneration(
  toolId: string,
  input: string,
  target: { tabId: number; frameId: number; editor: SelectionContext["editor"] } | null,
): Promise<void> {
  main.appendChild(h("div", "tc-sel", t("gen.generating")));
  const outcome = await generateViaWorker({
    toolId,
    input,
    target,
    host: "",
  });
  // Drop the transient "generating" row.
  main.lastElementChild?.remove();
  if ("error" in outcome) {
    const box = h("div", "tc-err", outcome.error);
    box.setAttribute("role", "alert");
    main.appendChild(box);
    if (outcome.signIn) {
      const btn = h("button", "tc-primary", t("auth.signIn"));
      btn.addEventListener("click", () => openSite("/sign-in"));
      main.appendChild(btn);
    }
    return;
  }
  lastContent = outcome.content;
  main.appendChild(h("div", "tc-label", "Result"));
  main.appendChild(h("div", "tc-result", outcome.content));
  const row = h("div", "tc-row");
  if (target && selection?.inEditable && selection.editor) {
    const replace = h("button", "tc-ghost", t("gen.replace"));
    const editor = selection.editor;
    const tid = target.tabId;
    replace.addEventListener("click", () => void (async () => {
      const ok = await insertIntoTab(tid, "replace", lastContent ?? "", editor);
      replace.textContent = ok ? t("gen.replaced") : t("gen.copied");
      if (!ok && lastContent) void copyToClipboard(lastContent);
    })());
    row.appendChild(replace);
    const insert = h("button", "tc-ghost", t("gen.insert"));
    insert.addEventListener("click", () => void (async () => {
      const ok = await insertIntoTab(tid, "insert", lastContent ?? "", editor);
      insert.textContent = ok ? t("gen.inserted") : t("gen.copied");
      if (!ok && lastContent) void copyToClipboard(lastContent);
    })());
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

(document.getElementById("open-site") as HTMLElement).addEventListener("click", () => openSite("/tools"));
(document.getElementById("upgrade") as HTMLElement).addEventListener("click", () => openSite("/pricing"));
(document.getElementById("settings") as HTMLElement).addEventListener("click", () => openOptions());

void boot();
