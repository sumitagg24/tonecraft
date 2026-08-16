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
 * the send button must stay fully on-screen and clickable: the toolbar is a
 * horizontal scroll container whose buttons must never spill over (and
 * intercept clicks on) the send button.
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

  test("composer: send button on-screen and clickable at md width", async ({
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

    // The toolbar is a horizontal scroll container at every breakpoint (the
    // send button lives OUTSIDE it, so it is never pushed off-screen). The
    // regression this guards is toolbar buttons spilling over the send button
    // and intercepting clicks — assert the send button's center is actually
    // hit-testable, not covered by an overflowing chip.
    const hit = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return "nothing";
      if (el.closest('[aria-label="Send message"]')) return "send";
      const cls = (el as HTMLElement).className;
      return (el.tagName + " " + String(cls).slice(0, 80)).trim();
    }, { x: sendBox.x + sendBox.width / 2, y: sendBox.y + sendBox.height / 2 });
    expect(hit, "send button center should not be covered by a toolbar chip").toBe("send");

    assertNoClientErrors(errors.filter((e) => !isEnvironmentalError(e)), "tablet chat workspace");
  });
});
