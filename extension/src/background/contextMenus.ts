/**
 * ToneCraft extension — context menus (service worker).
 *
 * One tidy `ToneCraft` parent with a small curated submenu (selection-only).
 * Clicking a menu item does NOT generate in the background: it forwards the
 * request to the tab's content script, which owns the editor context and
 * shows the floating result UI. If the content script isn't there (restricted
 * page), fall back to opening the tools hub on the site.
 */
import { browserApi } from "../shared/browserApi";
import { getPrefs } from "../shared/storage";
import { TOOL_BY_ID, CONTEXT_MENU_TOOLS } from "../shared/constants";
import { newRequestId } from "../shared/validate";
import type { ExtensionResponse } from "../shared/types";

const ROOT_ID = "tc-root";

async function siteBase(): Promise<string> {
  return (await getPrefs()).baseUrl;
}

export async function rebuildMenus(): Promise<void> {
  const prefs = await getPrefs();
  try {
    await chrome.contextMenus.removeAll();
    if (prefs.contextMenu === false) return;
    chrome.contextMenus.create({ id: ROOT_ID, title: "ToneCraft", contexts: ["selection", "page"] });
    for (const toolId of CONTEXT_MENU_TOOLS) {
      const tool = TOOL_BY_ID[toolId];
      if (!tool) continue;
      chrome.contextMenus.create({
        id: `tc-tool-${tool.id}`,
        parentId: ROOT_ID,
        title: tool.title,
        contexts: ["selection"],
      });
    }
    chrome.contextMenus.create({
      id: "tc-open-hub",
      parentId: ROOT_ID,
      title: "Open ToneCraft tools…",
      contexts: ["page", "selection"],
    });
  } catch {
    /* menus are best-effort (e.g. Firefox Android) */
  }
}

async function openHub(text: string): Promise<void> {
  const base = await siteBase();
  const params = new URLSearchParams();
  if (text.trim()) params.set("text", text.trim().slice(0, 2000));
  const qs = params.toString();
  await browserApi.createTab(`${base}/tools${qs ? `?${qs}` : ""}`);
}

export function wireContextMenus(): void {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
      const { menuItemId } = info;
      const selectionText = typeof info.selectionText === "string" ? info.selectionText : "";
      if (menuItemId === "tc-open-hub" || menuItemId === ROOT_ID) {
        await openHub(selectionText);
        return;
      }
      if (typeof menuItemId === "string" && menuItemId.startsWith("tc-tool-")) {
        const toolId = menuItemId.slice("tc-tool-".length);
        if (!TOOL_BY_ID[toolId] || !tab?.id) {
          await openHub(selectionText);
          return;
        }
        const requestId = newRequestId();
        try {
          await browserApi.sendTabMessage<ExtensionResponse>(tab.id, {
            type: "TC_GENERATE",
            requestId,
            payload: {
              requestId,
              toolId,
              input: selectionText,
              target: null,
              host: "",
            },
          });
        } catch {
          // No content script (restricted page / not yet injected) — hub fallback.
          await openHub(selectionText);
        }
      }
    } catch {
      /* never break the browser menu */
    }
  });
}
