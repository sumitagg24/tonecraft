import { test, expect } from "@playwright/test";
import { captureErrors, assertNoClientErrors, interactiveLogin } from "./utils";

/**
 * Signed-in chat flow smoke test: New Workspace → send a message → copy it.
 *
 * Same auth conventions as signed-in-smoke.spec.ts:
 *   A) E2E_STORAGE_STATE=./.auth/state.json  (pre-saved session, recommended)
 *   B) E2E_EMAIL="…" E2E_PASSWORD="…"        (interactive login)
 * Skipped in CI by default (no creds) and when the Clerk dev instance demands
 * email verification.
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

test("chat flow: New Workspace → send message → copy works", async ({ page, context }) => {
  test.setTimeout(240_000);
  const errors = captureErrors(page);

  if (!storageState) {
    const loginResult = await interactiveLogin(page, email as string, password as string);
    if (loginResult === "verify") {
      test.skip(true, "Clerk dev instance requires email verification — use E2E_STORAGE_STATE with an established session");
    }
  }

  // 1. Land on the chat index and create a fresh conversation.
  await page.goto("/chat", { waitUntil: "networkidle" });
  const newWorkspace = page.locator("header").getByRole("button", { name: "New Workspace" });
  await newWorkspace.waitFor({ timeout: 20_000 });
  await newWorkspace.click();
  await page.waitForURL(/\/chat\/[^/?]+$/, { timeout: 20_000 });

  // 2. The composer must be present and editable.
  const composer = page.getByLabel("Message input");
  await composer.waitFor({ timeout: 20_000 });
  await expect(composer).toBeEnabled();

  // 3. Send a message — the user note appears optimistically.
  const msg = `Smoke test ${Date.now()} — verify copy button`;
  await composer.fill(msg);
  await page.getByRole("button", { name: "Send message" }).click();
  const userNote = page.getByText(msg, { exact: false }).first();
  await userNote.waitFor({ timeout: 20_000 });

  // 4. Copy from the user message (hover reveals the action bar).
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: process.env.E2E_ORIGIN ?? "http://127.0.0.1:3100",
  });
  await userNote.hover();
  await page.getByRole("button", { name: "Copy", exact: true }).first().click();
  const clipUser = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipUser, "clipboard should hold the sent message").toContain(msg);

  // 5. Wait for the AI response to finish (best effort — streaming can be slow).
  await page
    .waitForFunction(
      () => !document.querySelector('[aria-label="Stop generating"]'),
      null,
      { timeout: 150_000 }
    )
    .catch(() => {}); // send errors/timeouts still leave the user note copyable
  await page.waitForTimeout(500);

  // 6. Copy from the last message (assistant reply when present, else user note).
  await page.getByRole("button", { name: "Copy", exact: true }).last().click();
  const clipLast = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipLast.length, "copy should write non-empty text").toBeGreaterThan(0);

  // 7. No console/page errors throughout the flow.
  assertNoClientErrors(errors, "chat flow");
});
