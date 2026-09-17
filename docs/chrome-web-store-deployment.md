# Chrome Web Store deployment — ToneCraft extension

## 0. Prerequisites (human account actions)

- A Google account with **2-Step Verification on** (required by Google for
  developers publishing/updating extensions).
- Chrome Web Store **developer registration completed** (one-time $5 fee).
- The release ZIP built below (do not modify it after validation).

## 1. Build the exact submission artifact

```bash
git checkout feat/browser-extension   # or the merged main containing it
npm ci
npm run extension:release
```

Expected output (version from `extension/manifest.base.json`, currently `1.0.0`):

```
built dist/extension-chrome (v1.0.0)
... (firefox, edge, safari)
extension validation passed.
wrote release/chrome/tonecraft-extension-chrome-v1.0.0.zip (16 files)
...
```

Verify the zip root (must list `manifest.json` first, no outer folder):

```bash
node -e "const{execSync}=require('child_process');console.log(execSync('powershell -c \"Add-Type -A System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::OpenRead(\\'release/chrome/tonecraft-extension-chrome-v1.0.0.zip\\').Entries | Select -First 5 Name\"').toString())"
```

## 2. Publish — exact clicks

1. Open the **Chrome Web Store Developer Dashboard**
   (`chrome.google.com/webstore/devconsole`).
2. If this is the first ToneCraft item: **Add new item** → upload
   `release/chrome/tonecraft-extension-chrome-v1.0.0.zip`. Otherwise open
   the existing ToneCraft item → **Package** → **Upload new package** →
   select the same file.
3. **Store listing** tab — paste from `extension/store/chrome-description.md`:
   - Detailed description → Description field.
   - Category: **Productivity**. Language: **English**.
4. **Store listing → Graphics**: upload icons (128 required;
   `extension/icons/icon128.png`) and screenshots from
   `extension/store/screenshots/` (`popup.png`, `floating-panel.png`,
   `sidepanel.png`; 1280×800 or 640×400 recommended).
5. **Privacy tab**:
   - Privacy policy URL: the public ToneCraft privacy page URL
     (see Manual action A below — the extension section must be live first).
   - Single purpose: select the closest (“provides writing assistance…”)
     and declare data usage **exactly** per `docs/extension-privacy.md`:
     user-invoked text sent to `tonecraft.site` for the AI feature;
     no keystroke logging; no background collection.
   - Permissions justification: paste the table from
     `docs/extension-permissions.md`.
6. **Distribution** tab: visibility **Public**, pricing **Free**
   (paid features unlock via the ToneCraft account, not in-extension
   payments).
7. **Submit for review**. Review typically takes hours–days. Do not
   re-upload unless asked.
8. After approval: install from the live listing on a clean profile and
   run the smoke list in `docs/extension-release-checklist.md` (UX section).

## 3. Updates (v1.0.1+)

1. Bump **only** `version` in `extension/manifest.base.json`.
2. Re-run `npm run extension:release`, upload the new zip to the same
   item. No re-review of unchanged listing copy needed.

## 4. Automation (optional, not configured)

Draft-upload automation via the Chrome Web Store Publish API (v2) is
possible: API access in the dashboard → OAuth client → GitHub secrets
(`CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`,
`CWS_EXTENSION_ID`) → upload on git tag → human clicks publish.
Not implemented: no store credentials exist in this repo, and automatic
publishing of a paid-feature extension is intentionally human-gated.
