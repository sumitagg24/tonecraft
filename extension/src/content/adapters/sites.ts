/**
 * ToneCraft extension — site-specific adapters.
 *
 * Each adapter below exists for a documented, real reason (selector gaps the
 * generic ancestor walk misses, or a quirk that needs a hook). Everything
 * else delegates to the shared insertion engine.
 */
import type { SiteAdapter } from "./types";

function hostIncludes(...fragments: string[]) {
  return (host: string) => fragments.some((f) => host === f || host.endsWith(`.${f}`));
}

function nudgeInput(el: HTMLElement): void {
  // Frameworks watching MutationObserver/key events pick up the synthetic
  // input event dispatched by the insertion engine; a second microtask
  // dispatch covers editors that batch on rAF.
  requestAnimationFrame(() => {
    try {
      el.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
    } catch {
      /* best-effort */
    }
  });
}

export const gmailAdapter: SiteAdapter = {
  id: "gmail",
  matches: hostIncludes("mail.google.com"),
  editorSelectors: [
    'div[aria-label="Message Body"]',
    'div[role="textbox"][aria-label*="Message"]',
    'div.gmail_default[class*="Am"]',
  ],
  afterInsert: nudgeInput,
  note: "Gmail compose is a same-document contenteditable; aria-label selectors find it when focus is elsewhere.",
};

export const linkedinAdapter: SiteAdapter = {
  id: "linkedin",
  matches: hostIncludes("linkedin.com"),
  editorSelectors: [
    ".msg-form__contenteditable",
    ".share-box__open",
    'div[role="textbox"][aria-label*="Post"]',
    'div[role="textbox"]',
  ],
  afterInsert: nudgeInput,
  note: "LinkedIn messaging + share box are role=textbox composites re-rendered aggressively; generic insertion applies.",
};

export const slackAdapter: SiteAdapter = {
  id: "slack",
  matches: hostIncludes("slack.com"),
  editorSelectors: [".ql-editor", '[data-qa="message_input"] .ql-editor'],
  afterInsert: nudgeInput,
  note: "Slack uses Quill (.ql-editor); beforeinput-compatible insertion keeps its model in sync.",
};

export const discordAdapter: SiteAdapter = {
  id: "discord",
  matches: hostIncludes("discord.com"),
  editorSelectors: ['[data-slate-editor="true"]', '[role="textbox"][aria-label*="Message"]'],
  afterInsert: nudgeInput,
  note: "Discord uses Slate; insertion via execCommand keeps the Slate model consistent.",
};

export const xAdapter: SiteAdapter = {
  id: "x",
  matches: hostIncludes("x.com", "twitter.com"),
  editorSelectors: ['[data-lexical-editor="true"]', '[role="textbox"][aria-label*="Post"]'],
  afterInsert: nudgeInput,
  note: "X uses Lexical; execCommand insertText flows through Lexical's beforeinput handling.",
};

export const notionAdapter: SiteAdapter = {
  id: "notion",
  matches: hostIncludes("notion.so", "notion.site"),
  editorSelectors: ['[data-content-editable="true"]', ".notion-text-block"],
  afterInsert: nudgeInput,
  note: "Notion blocks are contenteditable; insertion targets the focused block.",
};

export const githubAdapter: SiteAdapter = {
  id: "github",
  matches: hostIncludes("github.com"),
  editorSelectors: [
    'textarea[name="comment[body]"]',
    "#new_comment_field",
    'textarea[aria-label*="comment"]',
  ],
  note: "GitHub comments are plain textareas — the textarea path (setRangeText, undo-safe) applies.",
};

export const redditAdapter: SiteAdapter = {
  id: "reddit",
  matches: hostIncludes("reddit.com"),
  editorSelectors: [
    'textarea[name="body"]',
    '[data-lexical-editor="true"]',
    'div[role="textbox"]',
  ],
  afterInsert: nudgeInput,
  note: "Reddit mixes textareas (old/new comment boxes) and Lexical (rich editor).",
};

export const outlookAdapter: SiteAdapter = {
  id: "outlook",
  matches: hostIncludes("outlook.live.com", "outlook.office.com", "outlook.office365.com"),
  editorSelectors: ['div[role="textbox"][aria-label*="Message body"]', '[aria-label="Email compose area"]'],
  afterInsert: nudgeInput,
  note: "Outlook web compose is a role=textbox surface inside a heavy SPA shell.",
};

export const teamsAdapter: SiteAdapter = {
  id: "teams",
  matches: hostIncludes("teams.microsoft.com", "teams.live.com"),
  editorSelectors: ['[data-tid="ckeditor"]', '[role="textbox"]'],
  afterInsert: nudgeInput,
  note: "Teams web message box (CKEditor-backed); generic insertion with an observer nudge.",
};

export const facebookAdapter: SiteAdapter = {
  id: "facebook",
  matches: hostIncludes("facebook.com", "instagram.com", "threads.com"),
  editorSelectors: ['[data-lexical-editor="true"]', '[role="textbox"]'],
  afterInsert: nudgeInput,
  note: "Meta surfaces are Lexical-based; same handling as X.",
};

export const SITE_ADAPTERS: SiteAdapter[] = [
  gmailAdapter,
  linkedinAdapter,
  slackAdapter,
  discordAdapter,
  xAdapter,
  notionAdapter,
  githubAdapter,
  redditAdapter,
  outlookAdapter,
  teamsAdapter,
  facebookAdapter,
];
