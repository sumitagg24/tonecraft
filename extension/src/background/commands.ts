/**
 * ToneCraft extension — keyboard commands (service worker).
 *
 * Commands are declared in the manifest (Alt+T opens the side panel) and can
 * be remapped by the user at chrome://extensions/shortcuts. This module only
 * routes fired commands — it never invents shortcuts at runtime.
 */
import { browserApi } from "../shared/browserApi";

export function wireCommands(): void {
  try {
    chrome.commands.onCommand.addListener(async (command, tab) => {
      if (command === "tc-open-panel") {
        const opened = await browserApi.openSidePanel(tab?.windowId);
        if (!opened && tab?.id !== undefined) {
          // Side panel unsupported here — nudge the floating UI instead.
          try {
            await browserApi.sendTabMessage(tab.id, {
              type: "TC_GET_SELECTION",
              requestId: `cmd-${Date.now().toString(36)}`,
            });
          } catch {
            /* restricted page — nothing to do */
          }
        }
      }
    });
  } catch {
    /* commands unsupported — menu + floating UI remain */
  }
}
