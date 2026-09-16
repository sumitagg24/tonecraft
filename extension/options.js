const DEFAULT_BASE_URL = "https://tonecraft.site";
const input = document.getElementById("base-url");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");

function normalize(value) {
  return (value || "").trim().replace(/\/+$/, "");
}

chrome.storage.sync.get({ baseUrl: DEFAULT_BASE_URL }, (items) => {
  input.value = items.baseUrl || DEFAULT_BASE_URL;
});

saveBtn.addEventListener("click", () => {
  const value = normalize(input.value);
  let url;
  try {
    url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) throw new Error("http(s) only");
  } catch {
    statusEl.className = "status err";
    statusEl.textContent = "Enter a valid URL like https://tonecraft.site";
    return;
  }
  const base = url.origin + url.pathname.replace(/\/+$/, "");
  chrome.storage.sync.set({ baseUrl: base }, () => {
    statusEl.className = "status ok";
    statusEl.textContent = "Saved — deep links now open on " + base;
    input.value = base;
  });
});
