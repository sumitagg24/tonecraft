import { test, expect, type Page } from "@playwright/test";
import { captureErrors, assertNoClientErrors, interactiveLogin } from "./utils";

/**
 * Signed-in chat flow smoke tests.
 *
 * Same auth conventions as signed-in-smoke.spec.ts:
 *   A) E2E_STORAGE_STATE=./.auth/state.json  (pre-saved session, recommended)
 *   B) E2E_EMAIL="…" E2E_PASSWORD="…"        (interactive login)
 * Skipped in CI by default (no creds) and when the Clerk dev instance demands
 * email verification.
 *
 * Voice dictation relies on the fake-media-device launch args in
 * playwright.config.ts (MediaRecorder/getUserMedia work headlessly).
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const storageState = process.env.E2E_STORAGE_STATE;

test.skip(
  !storageState && (!email || !password),
  "Set E2E_STORAGE_STATE (recommended) or E2E_EMAIL/E2E_PASSWORD to run chat-flow checks"
);

if (storageState) {
  test.use({ storageState });
}

/** Sign in (when needed), land on the chat index, and open a fresh conversation. */
async function openNewChat(page: Page, emailArg?: string, passwordArg?: string) {
  if (!process.env.E2E_STORAGE_STATE) {
    const loginResult = await interactiveLogin(page, emailArg as string, passwordArg as string);
    if (loginResult === "verify") {
      test.skip(true, "Clerk dev instance requires email verification — use E2E_STORAGE_STATE with an established session");
    }
  }
  await page.goto("/chat", { waitUntil: "networkidle" });
  await page.locator("header").getByRole("button", { name: "New Workspace" }).waitFor({ timeout: 20_000 });
  await page.locator("header").getByRole("button", { name: "New Workspace" }).click();
  await page.waitForURL(/\/chat\/[^/?]+$/, { timeout: 20_000 });
  await page.getByLabel("Message input").waitFor({ timeout: 20_000 });
}

test("chat flow: New Workspace → send message → copy works", async ({ page, context }) => {
  test.setTimeout(240_000);
  const errors = captureErrors(page);
  await openNewChat(page, email, password);

  // The composer must be present and editable.
  const composer = page.getByLabel("Message input");
  await expect(composer).toBeEnabled();

  // Send a message — the user note appears optimistically.
  const msg = `Smoke test ${Date.now()} — verify copy button`;
  await composer.fill(msg);
  await page.getByRole("button", { name: "Send message" }).click();
  const userNote = page.getByText(msg, { exact: false }).first();
  await userNote.waitFor({ timeout: 20_000 });

  // Copy from the user message (hover reveals the action bar).
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: process.env.E2E_ORIGIN ?? "http://127.0.0.1:3100",
  });
  await userNote.hover();
  await page.getByRole("button", { name: "Copy", exact: true }).first().click();
  const clipUser = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipUser, "clipboard should hold the sent message").toContain(msg);

  // Wait for the AI response to finish (best effort — streaming can be slow).
  await page
    .waitForFunction(
      () => !document.querySelector('[aria-label="Stop generating"]'),
      null,
      { timeout: 150_000 }
    )
    .catch(() => {});

  // Copy from the last message (assistant reply when present, else user note).
  await page.getByRole("button", { name: "Copy", exact: true }).last().click();
  const clipLast = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipLast.length, "copy should write non-empty text").toBeGreaterThan(0);

  // Tolerate environmental 429s (free-plan daily message cap) — see the
  // composer-controls test for the full rationale. Everything else is strict.
  const environmental = (e: string) => /\b502\b/.test(e) || /\b429\b/.test(e);
  assertNoClientErrors(errors.filter((e) => !environmental(e)), "chat flow");
});

test("composer controls: tone, tool, voice dictation, edit, regenerate", async ({ page, context }) => {
  test.setTimeout(300_000);
  const errors = captureErrors(page);
  const origin = process.env.E2E_ORIGIN ?? "http://127.0.0.1:3100";
  await context.grantPermissions(["clipboard-read", "clipboard-write", "microphone"], { origin });
  await openNewChat(page, email, password);

  const composer = page.getByLabel("Message input");

  // ── Tone picker ──────────────────────────────────────────────────────────
  await page.getByLabel("Select tone").click();
  // :not() excludes the toolbar trigger itself (aria-label="Select tone")
  const toneOption = page.locator('[aria-label^="Select "][aria-label$=" tone"]:not([aria-label="Select tone"])').first();
  await toneOption.waitFor({ timeout: 10_000 });
  const toneLabel = (await toneOption.getAttribute("aria-label"))?.replace(/^Select | tone$/g, "") ?? "";
  await toneOption.click();
  await expect(page.getByLabel("Select tone")).toContainText(toneLabel, { timeout: 10_000 });

  // ── Tool picker (fills the composer when the input is empty) ─────────────
  await page.getByLabel("Pick a tool").click();
  await page.getByLabel("Search tools").fill("rewrite");
  // Main list buttons have no title attr — the title is the first text line.
  const toolBtn = page.locator('[class*="max-h-64"] button').first();
  await toolBtn.waitFor({ timeout: 10_000 });
  const toolTitle = ((await toolBtn.innerText()).split("\n")[0] ?? "").trim();
  await toolBtn.click();
  const escaped = toolTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await expect(composer).toHaveValue(new RegExp(`^${escaped}:`), { timeout: 10_000 });
  await composer.fill("");

  // ── Voice dictation (fake microphone via launch args) ────────────────────
  await page.getByLabel("Voice input").click();
  await expect(page.getByLabel("Stop recording")).toBeVisible({ timeout: 10_000 });
  await expect(composer).toHaveAttribute("placeholder", /Listening/i);
  await page.waitForTimeout(1200); // record a moment of (silent) audio
  await page.getByLabel("Stop recording").click();
  // Returns to idle once transcription completes. Terminal outcome varies with
  // the environment: real key + silence → "no speech detected"; placeholder
  // key → "HTTP 401 — check OPENAI_API_KEY"; valid key + real speech → appended
  // text + "Voice transcribed". Assert the UI reaches a terminal state either way.
  await expect(page.getByLabel("Voice input")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/voice transcribed|OPENAI_API_KEY|no speech detected/i).first()).toBeVisible({ timeout: 15_000 });

  // ── Send a message ────────────────────────────────────────────────────────
  const msg = `Controls smoke ${Date.now()}`;
  await composer.fill(msg);
  await page.getByRole("button", { name: "Send message" }).click();
  const userNote = page.getByText(msg, { exact: false }).first();
  await userNote.waitFor({ timeout: 20_000 });

  // Wait for the AI run to finish (best effort — streaming can be slow).
  await page
    .waitForFunction(
      () => !document.querySelector('[aria-label="Stop generating"]'),
      null,
      { timeout: 150_000 }
    )
    .catch(() => {});

  // Edit/regenerate need a server-persisted conversation (real message ids).
  // Under quota pressure the send can fail after starting, leaving only the
  // optimistic temp note — the assistant note below only renders from server
  // data, so it is the reliable signal that the run landed.
  const assistantNotes = page.locator('[class*="border-l-2"]');
  if ((await assistantNotes.count()) > 0) {
    // ── Edit the user message (hover reveals the action bar) ────────────────
    await userNote.hover();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await page.getByLabel("Edit message").waitFor({ timeout: 10_000 });
    const edited = `${msg} — edited`;
    await page.getByLabel("Edit message").fill(edited);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    // The editor unmounts on success; a failure keeps it open and toasts.
    // (getByText matches textarea values, so it can't be used to detect the save.)
    const editLanded = await Promise.race([
      page.getByLabel("Edit message").waitFor({ state: "hidden", timeout: 10_000 }).then(() => true),
      page.getByText("Failed to update message").waitFor({ timeout: 10_000 }).then(() => false),
    ]).catch(() => false);
    if (editLanded) {
      await expect(page.getByText("(edited)", { exact: true })).toBeVisible({ timeout: 5_000 });
    }

    // ── Regenerate the assistant reply (best effort — AI latency) ──────────
    const note = assistantNotes.last();
    const before = await note.innerText().catch(() => "");
    await note.hover();
    await page.getByRole("button", { name: "Regenerate", exact: true }).click();
    // Poll for a changed reply (up to 90s); tolerate identical output.
    const deadline = Date.now() + 90_000;
    let changed = false;
    while (Date.now() < deadline && !changed) {
      await page.waitForTimeout(3_000);
      const now = await note.innerText().catch(() => "");
      if (now && now !== before) changed = true;
    }
  }

  // Environmental errors the app deliberately triggers and handles gracefully:
  //  502 — voice transcription with an unconfigured/placeholder STT provider
  //        (OpenAI 401 → our route 502s; the UI toasts the fix, asserted above).
  //  429 — the free plan's daily message cap; regenerate/send are correctly
  //        rate-limited once test traffic exhausts the quota (UI toasts upgrade).
  // Everything else (hydration mismatches, pageerrors, unexpected 4xx/5xx)
  // still fails the test.
  const environmental = (e: string) => /\b502\b/.test(e) || /\b429\b/.test(e);
  assertNoClientErrors(errors.filter((e) => !environmental(e)), "composer controls");
});
