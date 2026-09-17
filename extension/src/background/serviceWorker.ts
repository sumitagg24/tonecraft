/**
 * ToneCraft extension — service worker entry.
 *
 * Wires lifecycle (install/startup → menus), context menus, keyboard
 * commands, and the message router. No generation logic lives here; see
 * generation.ts / apiClient.ts / session.ts.
 */
import { browserApi } from "../shared/browserApi";
import { rebuildMenus, wireContextMenus } from "./contextMenus";
import { wireCommands } from "./commands";
import { wireMessages } from "./messages";
import { invalidateSessionCache } from "./session";

browserApi.onInstalled((details) => {
  void rebuildMenus();
  invalidateSessionCache();
  if (details.reason === "install") {
    // First run: open onboarding (options page doubles as onboarding until
    // the user completes it — see options.ts).
    chrome.runtime.openOptionsPage().catch(() => undefined);
  }
});

browserApi.onStartup(() => {
  void rebuildMenus();
  invalidateSessionCache();
});

// Storage changes (e.g. toggling the context menu in options) rebuild menus.
try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.contextMenu) void rebuildMenus();
  });
} catch {
  /* non-critical */
}

wireContextMenus();
wireCommands();
wireMessages();
