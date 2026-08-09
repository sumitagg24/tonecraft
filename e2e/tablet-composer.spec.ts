import { test, expect, type Page } from "@playwright/test";
import {
  captureErrors,
  assertNoClientErrors,
  interactiveLogin,
  expectNoHorizontalOverflow,
  isEnvironmentalError,
} from "./utils";

/**
 * md-breakpoint (768–1023px) composer guard — runs on the tablet-ios project
 * (iPad Pro 11, 834px; see playwright.config.ts).
 *
 * At tablet width the shell renders the desktop layout: the header "New
 * Workspace" button is visible (hidden sm:flex) and there is no mobile nav
 * drawer, so this uses a different open-chat path than the phone checks in
 * mobile-responsive.spec.ts. It pins the composer layout at the md range —
 * the send button must stay fully on-screen and the toolbar must NOT force
 * horizontal scrolling (the mobile toolbar scroll is md:overflow-visible).
 *
 * Signed-in only (the composer lives behind auth) — same conventions as
 * signed-in-smoke.spec.ts (E2E_STORAGE_STATE or E2E_EMAIL/E2E_PASSWORD); skips
 * with a hint when no session is provided.
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const storageState = process.env.E2E_STORAGE_STATE;

test.describe("tablet chat workspace (md range)", () => {
  test.skip(
    !storageState && (!email || !password),
    "Set E2E_STORAGE_STATE (recommended) or E2E_EMAIL/E2E_PASSWORD to run the tablet composer checks"
  );

  if (storageState) {
    test.use({ storageState });
  }

  /** Tablet path to a fresh conversation: sign in (Mode B) → header New Workspace. */
  async function openNewChatTablet(page: Page) {
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
    // At md+ both the header button and the desktop rail expose "New
    // Workspace" — use the header (banner) one explicitly to avoid a strict
    // mode violation.
    await page.getByRole("banner").getByRole("button", { name: "New Workspace" }).click();
    await page.waitForURL(/\/chat\/[^/?]+$/, { timeout: 20_000 });
    await page.getByLabel("Message input").waitFor({ timeout: 20_000 });
  }

  test("composer: send button on-screen and no forced horizontal scroll at md width", async ({
    page,
  }) => {
    const errors = captureErrors(page);
    await openNewChatTablet(page);

    // The app shell itself must not overflow horizontally.
    await expectNoHorizontalOverflow(page, "/chat/[id] (tablet)");

    // Regression: the send button used to be pushed off-screen by the toolbar.
    // It must be fully inside the 834px viewport on the right edge.
    const viewport = page.viewportSize();
    const sendBox = await page.getByRole("button", { name: "Send message" }).boundingBox();
    expect(sendBox, "send button should have a bounding box").not.toBeNull();
    expect(viewport, "viewport size should be available").not.toBeNull();
    if (!sendBox || !viewport) throw new Error("missing send button or viewport geometry");
    expect(sendBox.x, "send button should not start off-screen left").toBeGreaterThanOrEqual(0);
    expect(
      sendBox.x + sendBox.width,
      "send button should not extend past the right edge of the viewport"
    ).toBeLessThanOrEqual(viewport.width + 1);

    // At md the toolbar must NOT create a scroll container (mobile-only scroll
    // is md:overflow-visible — a regression here means the toolbar pushes the
    // send button off-screen at tablet width).
    const toolbarOverflowX = await page.getByLabel("Select tone").evaluate((el) => {
      const scroll = el.closest(".overflow-x-auto") as HTMLElement | null;
      return scroll ? getComputedStyle(scroll).overflowX : null;
    });
    expect(
      toolbarOverflowX,
      "tablet toolbar should not be a horizontal scroll container"
    ).not.toBe("auto");

    assertNoClientErrors(errors.filter((e) => !isEnvironmentalError(e)), "tablet chat workspace");
  });
});
