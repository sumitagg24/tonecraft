/**
 * ToneCraft extension — user-facing strings (English).
 *
 * All UI copy lives here so localization can replace this module later.
 * t() falls back to the key itself so a missing entry never blanks the UI.
 */

const STRINGS: Record<string, string> = {
  "app.name": "ToneCraft",
  "app.tagline": "AI writing assistance everywhere you type.",

  "auth.required.title": "Sign in to ToneCraft",
  "auth.required.body": "Connect your ToneCraft account to rewrite, improve, and generate text anywhere.",
  "auth.signIn": "Sign in",
  "auth.refresh": "Refresh session",
  "auth.signedOutHint": "You were signed out. Sign in on the ToneCraft site, then come back.",

  "gen.generating": "Generating…",
  "gen.cancel": "Cancel",
  "gen.retry": "Retry",
  "gen.copy": "Copy",
  "gen.replace": "Replace",
  "gen.insert": "Insert",
  "gen.copied": "Copied",
  "gen.inserted": "Inserted",
  "gen.replaced": "Replaced",
  "gen.writeIdea": "What do you want to say?",
  "gen.generate": "Generate",
  "gen.tone": "Tone",
  "gen.length": "Length",
  "gen.language": "Language (e.g. Spanish)",
  "gen.instructions": "Extra instructions (optional)",

  "err.offline": "ToneCraft needs an internet connection to generate.",
  "err.unauthorized": "Your ToneCraft session expired. Sign in again to continue.",
  "err.rateLimited": "You hit a ToneCraft limit. Wait a moment — or upgrade for more.",
  "err.upgrade": "Your plan doesn't include more generations. Upgrade on the ToneCraft site.",
  "err.badInput": "That input can't be processed. Try shorter text.",
  "err.server": "ToneCraft couldn't generate right now. Please retry.",
  "err.insert": "Couldn't place the text in this editor — it was copied instead. Paste it with Ctrl+V.",
  "err.editorGone": "The editor changed while generating. The result is ready to copy.",
  "err.unknown": "Something went wrong. Please retry.",

  "popup.quickActions": "Quick actions",
  "popup.compose": "Compose",
  "popup.recent": "Recent",
  "popup.openSite": "Open ToneCraft",
  "popup.upgrade": "Upgrade",
  "popup.settings": "Settings",
  "popup.noSelection": "Select text on the page, or type below to compose.",

  "options.title": "ToneCraft extension settings",
  "options.saved": "Saved.",
  "options.invalidUrl": "Enter a valid http(s) URL.",

  "onboarding.title": "Welcome to ToneCraft",
  "onboarding.pin": "Pin ToneCraft to your toolbar",
  "onboarding.signin": "Sign in with your ToneCraft account",
  "onboarding.select": "Select text anywhere and pick an action",
  "onboarding.insert": "Replace, insert, or copy the result",
  "onboarding.skip": "Skip",
  "onboarding.done": "Get started",

  "unsupported.title": "ToneCraft isn't available on this browser page.",
  "unsupported.body": "Extensions can't run on browser-internal pages. Try any website with text.",
};

export function t(key: string): string {
  return STRINGS[key] ?? key;
}
