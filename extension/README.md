# ToneCraft — Rewrite Anywhere (browser extension)

Production Manifest V3 extension: select text on any site for Rewrite /
Improve / Shorten / Expand / tones / Translate, or compose from the popup
and side panel — all powered by your ToneCraft account (same Clerk login,
plan, and limits as the website). Generation runs on ToneCraft's backend;
no AI keys live in the extension.

- **Install (developer mode):** `npm run extension:build:chrome`, then
  `chrome://extensions` → Developer mode → **Load unpacked** →
  `dist/extension-chrome`.
- **Docs:** `docs/browser-extension.md` (architecture/dev/auth/testing),
  `docs/extension-permissions.md`, `docs/extension-privacy.md`,
  `docs/chrome-web-store-deployment.md`,
  `docs/extension-release-checklist.md`.
- **Version source:** `manifest.base.json` (`version`) — manifests and zip
  names are generated from it. Never hand-edit `dist/`.
- **Release:** `npm run extension:release` → upload
  `release/chrome/tonecraft-extension-chrome-vX.Y.Z.zip` per the
  deployment doc. Firefox/Edge/Safari packages are generated alongside
  (see browser-support notes in `docs/browser-extension.md`).
- **Icons:** committed in `icons/`; regenerate with
  `node extension/scripts/gen-icons.js`.

## Legacy files (superseded)

The old deep-link-only implementation (`manifest.json`, `background.js`,
`popup.html/js/css`, `options.html/js` at this folder's root) is kept for
reference but is **not** what gets built or packaged — the build uses
`src/` + `manifest.base.json` only. It will be removed in a cleanup pass
once the new packages are published.
