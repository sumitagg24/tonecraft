import { test, expect, type Page } from "@playwright/test";
import {
  captureErrors,
  assertNoClientErrors,
  interactiveLogin,
  isEnvironmentalError,
} from "./utils";

/**
 * Composer attach-button guard — runs on ALL projects (desktop, mobile-android,
 * mobile-ios, tablet-ios; see playwright.config.ts).
 *
 * Chat attachments were re-added in v1.6.0 on top of Cloudflare R2 (the
 * /api/upload route + composer paperclip). This spec pins that the attach
 * button + hidden file input are present in the composer on every viewport and
 * guards the chat send flow against regressions from the composer surgery.
 *
 * Scoping note: paperclip icons also appear OUTSIDE the composer — in message
 * cards (they display attached files) and the AI context panel's "Attachments"
 * section header — so presence assertions are scoped to the composer root.
 *
 * Signed-in only — same conventions as signed-in-smoke.spec.ts
 * (E2E_STORAGE_STATE or E2E_EMAIL/E2E_PASSWORD); skips when no session.
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const storageState = process.env.E2E_STORAGE_STATE;

test.describe("composer attach + send flow", () => {
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

  test("composer exposes the attach button + file input (R2 attachments)", async ({ page }) => {
    const errors = captureErrors(page);
    await openNewChat(page);

    const composer = page.getByLabel("Message input");
    await expect(composer).toBeEnabled();

    const composerRoot = composer.locator(
      "xpath=ancestor::div[contains(@class,'rounded-2xl')][1]"
    );

    // 1. The "Attach files" toolbar button must exist and be clickable.
    await expect(
      composerRoot.getByRole("button", { name: "Attach files", exact: true }),
      "the 'Attach files' toolbar button should exist"
    ).toBeVisible();

    // 2. The hidden file input behind the paperclip must exist (multiselect).
    const fileInput = composerRoot.locator('input[type="file"]');
    await expect(fileInput, "the composer's file input should exist").toHaveCount(1);
    await expect(fileInput).toHaveAttribute("multiple", "");

    // 3. The send button still exists and is wired up (disabled only when empty).
    await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();

    assertNoClientErrors(
      errors.filter((e) => !isEnvironmentalError(e)),
      "composer attach presence"
    );
  });

  test("chat send flow still works with the composer surgery", async ({ page }) => {
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
