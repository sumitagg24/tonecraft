/* ToneCraft — Rewrite Anywhere: background service worker.
 *
 * Deep-links selected text into the ToneCraft tools page:
 *   <base>/tools?tool=<toolId>&text=<selection>
 * The web app reads `tool` + `text` and pre-fills the tool input, so the user
 * is one click ("Generate") away from a rewrite on any site.
 */

const DEFAULT_BASE_URL = "https://tonecraft.site";
const MAX_SELECTION_CHARS = 2000; // keep the deep-link URL comfortably short

const ROOT_ID = "tc-root";

const CONTEXT_TOOLS = [
  { id: "enhance", title: "Rewrite with a new tone" },
  { id: "grammar-fix", title: "Fix grammar & polish" },
  { id: "professional-rewrite", title: "Make it professional" },
  { id: "casual-rewrite", title: "Make it casual" },
  { id: "summarize", title: "Summarize selection" },
];

function getBaseUrl() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ baseUrl: DEFAULT_BASE_URL }, (items) => {
      resolve((items.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, ""));
    });
  });
}

function toolsUrl(base, toolId, text) {
  const params = new URLSearchParams();
  if (toolId) params.set("tool", toolId);
  if (text && text.trim()) params.set("text", text.trim().slice(0, MAX_SELECTION_CHARS));
  const qs = params.toString();
  return `${base}/tools${qs ? `?${qs}` : ""}`;
}

async function openTools(toolId, text) {
  const base = await getBaseUrl();
  const url = toolsUrl(base, toolId, text);
  await chrome.tabs.create({ url });
}

function ensureMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: ROOT_ID,
      title: "ToneCraft",
      contexts: ["selection", "page"],
    });
    for (const t of CONTEXT_TOOLS) {
      chrome.contextMenus.create({
        id: `tc-${t.id}`,
        parentId: ROOT_ID,
        title: t.title,
        contexts: ["selection"],
      });
    }
    chrome.contextMenus.create({
      id: "tc-open-hub",
      parentId: ROOT_ID,
      title: "Open ToneCraft Tools…",
      contexts: ["page"],
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureMenus();
});
chrome.runtime.onStartup.addListener(() => {
  ensureMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const { menuItemId, selectionText } = info;
  const text = selectionText || "";
  if (menuItemId === "tc-open-hub") {
    openTools("", text);
    return;
  }
  if (typeof menuItemId === "string" && menuItemId.startsWith("tc-")) {
    const toolId = menuItemId.slice("tc-".length);
    const known = CONTEXT_TOOLS.some((t) => t.id === toolId);
    if (known) {
      openTools(toolId, text);
      return;
    }
  }
  if (menuItemId === ROOT_ID) {
    // Clicking the parent: open the tools hub (fall back to chat).
    openTools("", text);
    return;
  }
  void tab;
});

// Popup sends { action: "open", toolId, text }.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.action === "open") {
    openTools(message.toolId || "", message.text || "").then(() => sendResponse({ ok: true }));
    return true; // async response
  }
  return false;
});
