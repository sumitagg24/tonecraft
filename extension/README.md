# ToneCraft — Rewrite Anywhere (browser extension)

A Chrome (Manifest V3) extension that puts ToneCraft one right-click away on any
website:

- **Select text → right-click → ToneCraft** → pick a tool (`Enhance tone`,
  `Fix grammar`, `Make it professional`, `Make it casual`, `Summarize`) and the
  ToneCraft tools page opens with your text **pre-filled** — hit **Generate**.
- **Toolbar popup** — paste/type any text, pick a tool, and open it in
  ToneCraft; or jump straight to the tools hub.
- **Configurable site URL** (options page) for self-hosted / alternate domains.

The rewrite itself happens on `tonecraft.site`, so it uses your normal ToneCraft
account — no extra credentials, and the **Free plan's 5 generations/day** limit
applies.

## Install (developer mode)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select this `extension/` folder.
4. Pin the ToneCraft icon from the puzzle menu if you want the popup handy.

> Publishing to the Chrome Web Store (and Edge Add-ons) is covered below — the
> extension is production-ready: icons for every required size are in
> `extension/icons/` and the store listing points at `https://tonecraft.site`.

## How it works

```
background.js   registers the context menus and opens deep links
popup.*         quick "paste text → pick tool" UI
options.*       choose the ToneCraft base URL (default https://tonecraft.site)
manifest.json   MV3: permissions are only contextMenus + storage
```

Deep links use the URL format the app already supports:

```
https://tonecraft.site/tools?tool=<toolId>&text=<url-encoded text>
```

`toolId` values come from the app's tool catalog (`enhance`, `grammar-fix`,
`professional-rewrite`, `casual-rewrite`, `friendly-rewrite`, `summarize`,
`translate`, `linkedin-reply`, `email-writer`, …).

## Notes & limits

- Selections are truncated at **2,000 characters** (popup at 4,000) to keep the
  deep-link URL well under browser limits. Rewrite very long documents from the
  Tools page or Composer instead.
- You must be signed in to ToneCraft in the same browser (any tab). If you're
  not, Clerk will ask you to sign in; reopen the deep link afterwards.
- Text is sent to `tonecraft.site` in the URL — don't use it for secrets.
  Future versions can pass content via a same-origin content script instead.
- Regenerate the icons after tweaking them:

```bash
node scripts/gen-icons.js
```

## Configuration (per install)

1. **Site URL** — right-click the ToneCraft icon → **Options**. The default is
   `https://tonecraft.site` (which redirects to `https://www.tonecraft.site`);
   set it explicitly to `https://www.tonecraft.site` to skip the redirect, or
   to any self-hosted/preview URL. The URL is stored per-browser in
   `chrome.storage.sync`, so it follows the signed-in Google profile.
2. **Sign-in** — the extension itself has no login. Rewrites happen on the
   ToneCraft site, so the user signs in with their normal ToneCraft account in
   any tab of the same browser (Clerk). If they aren't signed in, the deep link
   shows the sign-in page; they sign in and re-open it.
3. **Toolbox URL shape** — no configuration needed; the extension builds
   `<base>/tools?tool=<id>&text=<text>` and the app pre-fills the tool input.

Everything else is fixed in the manifest: `contextMenus` (to attach the
right-click menu) and `storage` (to remember the site URL) — there are no host
permissions, so no install-time "reads your data on all sites" warning beyond
Chrome's standard context-menu disclosure.

## Deploying the extension (where it "runs")

There is nothing to host or deploy server-side: the extension is a thin client
that deep-links into the ToneCraft web app (which deploys on Vercel as usual).
"Deploying" the extension therefore means **publishing a new version to a
store** — the web app URL is just configuration (see above). Bump
`manifest.json` → `version` on every release so stores pick up the update.

## Publishing to the Chrome Web Store

1. **Developer account** — go to the [Chrome Web Store developer dashboard]
   (https://chrome.google.com/webstore/devconsole) and pay the one-time
   **US$5** registration fee.
2. **Package the zip** — the zip must contain the extension **contents** at the
   root (manifest.json at the top level, not inside an `extension/` folder):

   ```bash
   cd extension
   zip -r ../tonecraft-extension-1.0.0.zip manifest.json background.js \
     popup.html popup.css popup.js options.html options.js icons
   # Windows without zip:  tar -a -c -f ../tonecraft-extension-1.0.0.zip manifest.json background.js popup.html popup.css popup.js options.html options.js icons
   ```

3. **Create a new item** → upload the zip. The dashboard runs an automated
   review (manifest validity, icon sizes, permissions) before you can submit.
4. **Listing details**:
   - **Name**: ToneCraft — Rewrite Anywhere
   - **Summary** (132 chars max, first line of the description):
     Select text on any page and rewrite it with ToneCraft's tone engine.
   - **Description**: mention right-click rewrite (enhance, grammar, make
     professional/casual, summarize), the toolbar popup, that rewrites happen
     on tonecraft.site with your normal account, and the Free plan's 5
     generations/day.
   - **Category**: Productivity · **Language**: English (US)
   - **Screenshots**: 1280×800 or 640×400 (a few: popup, options page, the
     tools page with a pre-filled rewrite, and the right-click menu).
   - **Promo tiles**: small 440×280 and marquee 1400×560 (optional but
     recommended); the 128px icon is reused from `icons/icon128.png`.
   - **Privacy**: the extension collects **no data itself** — it stores only
     the site URL you entered, and sends your selected text to tonecraft.site
     only when you explicitly invoke a tool. The store will ask for a privacy
     policy URL: link `https://www.tonecraft.site/privacy` (the site already
     has one) and tick "uses only the permissions required" / no user data
     collection where applicable.
5. **Submit for review** — typical turnaround is 1–5 days (first review can
   take longer). Use the **Test accounts / Trusted testers** tabs to share a
   draft link meanwhile, and publish from the dashboard once approved.
6. **Updates** — bump `version` in `manifest.json`, re-zip, and upload as a
   new draft; Chrome auto-updates installed users within ~1 hour–a day.

### Other stores

- **Microsoft Edge Add-ons** (free, no fee): the [Edge partner portal]
  (https://partner.microsoft.com/dashboard/microsoftedge) accepts the **same
  Chrome zip** directly — most MV3 extensions pass unchanged.
- **Firefox** is not supported by this build (no `browser_specific_settings`,
  and Firefox needs the `menus` API shim); treat Chrome + Edge as the target
  for now.
- **Opera** accepts Chrome extensions via [addons.opera.com].

## Release checklist

- [ ] Tool ids used here (`enhance`, `grammar-fix`, `professional-rewrite`,
      `casual-rewrite`, `summarize`) still exist in the app's tool catalog.
- [ ] The target site URL is correct in the store description and options
      default.
- [ ] Icons regenerated after any design change (`node scripts/gen-icons.js`).
- [ ] `version` bumped in `manifest.json`; zip rebuilt with contents at root.
- [ ] Smoke-tested via **Load unpacked** against `https://www.tonecraft.site`
      while signed in.
