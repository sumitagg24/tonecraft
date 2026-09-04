/* ToneCraft popup: hand the selected/pasted text to the service worker, which
 * opens the ToneCraft tools page with it pre-filled. */
const MAX_CHARS = 4000;

const input = document.getElementById("text-input");
const counter = document.getElementById("char-count");
const toolSelect = document.getElementById("tool-select");
const generateBtn = document.getElementById("generate");
const hubBtn = document.getElementById("hub");

function updateCounter() {
  counter.textContent = input.value.length;
}
input.addEventListener("input", updateCounter);
updateCounter();

function openTool(toolId, text) {
  chrome.runtime.sendMessage({ action: "open", toolId, text }, () => {
    if (chrome.runtime.lastError) {
      // Service worker restarted mid-message; retry once.
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: "open", toolId, text }, () => {});
      }, 150);
    }
  });
}

generateBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }
  openTool(toolSelect.value, text.slice(0, MAX_CHARS));
});

hubBtn.addEventListener("click", () => {
  openTool("", input.value.trim().slice(0, MAX_CHARS));
});
