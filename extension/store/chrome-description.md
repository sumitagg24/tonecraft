# ToneCraft — Rewrite Anywhere (Chrome Web Store copy)

## Short description (≤132 chars)

Rewrite any text anywhere with ToneCraft — tones, grammar, summaries. Uses your ToneCraft account.

## Detailed description

ToneCraft lets you rewrite, improve, shorten, expand, change tone, and
generate text directly where you work — LinkedIn, Gmail, Slack, X,
Reddit, Discord, Notion, GitHub, and practically any site with a text
field.

How it works:
1. Select text on any page — a small ToneCraft button appears.
2. Pick Rewrite, Improve, Shorten, Expand, Grammar, a tone, Translate, and more.
3. Replace, insert, or copy the result. Ctrl+Z always undoes.

Also included: a popup with your plan and usage plus one-click actions, a
side panel workspace (Alt+T) with tone/length/instructions controls,
right-click menu, and compose templates that draft emails, posts, and
replies from a bare idea.

One account: sign in with your existing ToneCraft account and your plan
and limits apply everywhere — Free includes daily generations, paid plans
raise them. AI runs on ToneCraft's secure backend; no AI keys live in the
extension.

Honest compatibility note: ToneCraft handles standard text fields and
major rich editors (including Gmail, Slack, LinkedIn, X, Discord, Notion
composers). Google Docs' canvas editor and editors inside cross-origin
iframes are best-effort and fail gracefully. Password and payment fields
are never touched.

## Category

Productivity

## Permission justifications (for the review team)

- `storage`: extension settings (tone, toggles) and recent-action metadata.
- `contextMenus`: the ToneCraft right-click submenu.
- `cookies`: read our own site's login cookie to call our API as the
  signed-in user — no other domains.
- `sidePanel`: the optional side-panel workspace.
- Host access to `tonecraft.site` only: our first-party API.
- Read text on sites you visit: the core feature — only the text you
  explicitly select (or type into our compose box) is ever sent, and only
  to our API when you invoke an action.
