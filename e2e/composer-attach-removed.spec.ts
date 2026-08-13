import { test, expect, type Page } from "@playwright/test";
import {
  captureErrors,
  assertNoClientErrors,
  interactiveLogin,
  isEnvironmentalError,
} from "./utils";

/**
 * Composer attach-button regression guard — runs on ALL projects (desktop,
 * mobile-android, mobile-ios, tablet-ios; see playwright.config.ts).
 *
 * The file-storage feature (R2 / Backblaze B2 chat attachments) was removed in
 * v1.5.0, and with it the composer's paperclip "Attach files" button + hidden
 * file input. This spec pins that removal (no dead button on any viewport) and
 * guards the chat send flow against regressions from the composer surgery.
 *
 * Scoping note: Paperclip icons still legitimately appear OUTSIDE the composer
 * — in message cards (they display already-attached files) and the AI context
 * panel's "Attachments" section header — and library pages still have file
 * inputs (knowledge upload, persona/prompt import). So the "no attach button"
 * assertions are scoped to the composer root only.
 *
 * Signed-in only — same conventions as signed-in-smoke.spec.ts
 * (E2E_STORAGE_STATE or E2E_EMAIL/E2E_PASSWORD); skips when no session.
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const storageState = process.env.E2E_STORAGE_STATE;

test.describe("composer attach removal + send flow", () => {
  test.skip(
    !storageState && (!email || !password),
    "Set E2E_STORAGE_STATE (recommended) or E2E_EMAIL/E2E_PASSWORD to run the composer checks"
  );

  if (storageState) {
    test.use({ storageState });
  }

  /**
   * Viewport-adaptive open-chat: at md+ (desktop/tablet) the header banner
   * "New Workspace" button is visible; below sm (phones) it is hidden
   * (hidden sm:flex) and creation goes through the navigation drawer instead.
   */
  async function openNewChat(page: Page) {
    if (!storageState && email && password) {
      const result = await interactiveLogin(page, email, password);
      if (result === "verify") {
        test.skip(
          true,
          "Clerk dev instance requires email verification — use E2E_STORAGE_STATE with an established session"
        );
      }
    }
    await page.goto("/chat", { waitUntil: "networkidle" });

    // Wait for the shell to settle, then pick the path the viewport exposes.
    const bannerNew = page.getByRole("banner").getByRole("button", { name: "New Workspace" });
    const drawerOpen = page.getByRole("button", { name: "Open navigation" });
    await Promise.race([
      bannerNew.waitFor({ state: "visible", timeout: 20_000 }),
      drawerOpen.waitFor({ state: "visible", timeout: 20_000 }),
    ]);

    if (await bannerNew.isVisible()) {
      await bannerNew.click();
    } else {
      await drawerOpen.click();
      await page.getByRole("button", { name: "New Workspace" }).click();
    }
    await page.waitForURL(/\/chat\/[^/?]+$/, { timeout: 20_000 });
    await page.getByLabel("Message input").waitFor({ timeout: 20_000 });
  }

  test("composer has no paperclip/attach button (storage removed)", async ({ page }) => {
    const errors = captureErrors(page);
    await openNewChat(page);

    const composer = page.getByLabel("Message input");
    await expect(composer).toBeEnabled();

    // The composer's bounding box: the innermost rounded-2xl container holds
    // the textarea + toolbar (the removed attach button lived in the toolbar).
    const composerRoot = composer.locator(
      "xpath=ancestor::div[contains(@class,'rounded-2xl')][1]"
    );

    // 1. The "Attach files" toolbar button must be gone.
    await expect(
      composerRoot.getByRole("button", { name: "Attach files", exact: true }),
      "the 'Attach files' toolbar button should no longer exist"
    ).toHaveCount(0);

    // 2. The hidden file input behind the paperclip must be gone.
    await expect(
      composerRoot.locator('input[type="file"]'),
      "the composer's hidden file input should no longer exist"
    ).toHaveCount(0);

    // 3. No paperclip icon anywhere inside the composer (the button's glyph).
    await expect(
      composerRoot.locator(".lucide-paperclip"),
      "no paperclip icon should render inside the composer"
    ).toHaveCount(0);

    // The send button still exists and is wired up (disabled only when empty).
    await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();

    assertNoClientErrors(
      errors.filter((e) => !isEnvironmentalError(e)),
      "composer attach removal"
    );
  });

  test("chat send flow still works after the composer surgery", async ({ page }) => {
    test.setTimeout(240_000);
    const errors = captureErrors(page);
    await openNewChat(page);

    const composer = page.getByLabel("Message input");
    await expect(composer).toBeEnabled();

    // Send a message — the user note appears optimistically.
    const msg = `Send flow smoke ${Date.now()}`;
    await composer.fill(msg);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(msg, { exact: false }).first()).toBeVisible({
      timeout: 20_000,
    });

    // The composer clears after send.
    await expect(composer).toHaveValue("", { timeout: 10_000 });

    // Let the AI run settle before asserting zero client errors (best effort —
    // shorter cap than chat-flow: this spec guards the SEND flow, not the reply;
    // under quota refusal the wait can otherwise burn the full budget).
    await page
      .waitForFunction(
        () => !document.querySelector('[aria-label="Stop generating"]'),
        null,
        { timeout: 60_000 }
      )
      .catch(() => {});

    assertNoClientErrors(
      errors.filter((e) => !isEnvironmentalError(e)),
      "chat send flow"
    );
  });
});
