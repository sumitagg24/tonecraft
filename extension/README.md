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

> Web Store distribution is a follow-up: `extension/icons/` must be shipped
> (already generated), and the store listing would link to
> `https://tonecraft.site`.

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
