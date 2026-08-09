import { test, expect, type Page } from "@playwright/test";
import {
  captureErrors,
  assertNoClientErrors,
  interactiveLogin,
  expectNoHorizontalOverflow,
  isEnvironmentalError,
} from "./utils";

/**
 * Responsive regression guard — runs on the mobile viewport projects
 * (mobile-android, mobile-ios; see playwright.config.ts).
 *
 * Catches the classes of mobile breakage seen in the field:
 *  - the composer toolbar overflowing and pushing the send button off-screen,
 *  - pages that scroll horizontally instead of fitting the viewport,
 *  - pickers/menus that only work on hover and are unusable on touch.
 *
 * The auth-free public-page overflow check lives in responsive-overflow.spec.ts
 * (it runs on every project, including tablet/desktop). The chat-workspace
 * checks below need a signed-in session and are scoped to a gated describe —
 * same conventions as signed-in-smoke.spec.ts (E2E_STORAGE_STATE or
 * E2E_EMAIL/E2E_PASSWORD); they skip with a hint when no session is provided.
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const storageState = process.env.E2E_STORAGE_STATE;

/** Mobile path to a fresh conversation: sign in (Mode B) → nav drawer → New Workspace. */
async function openNewChatMobile(page: Page) {
  if (!storageState && email && password) {
    // Mode B: clerkMiddleware redirects unauthenticated /chat → /sign-in, so
    // log in interactively first (same flow as signed-in-smoke.spec.ts).
    const result = await interactiveLogin(page, email, password);
    if (result === "verify") {
      test.skip(
        true,
        "Clerk dev instance requires email verification — use E2E_STORAGE_STATE with an established session"
      );
    }
  }
  await page.goto("/chat", { waitUntil: "networkidle" });
  // Below the sm breakpoint the header "New Workspace" button is hidden —
  // creation happens through the navigation drawer instead.
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "New Workspace" }).click();
  await page.waitForURL(/\/chat\/[^/?]+$/, { timeout: 20_000 });
  await page.getByLabel("Message input").waitFor({ timeout: 20_000 });
}

// ── Signed-in chat checks ───────────────────────────────────────────────────
// These need a session (the composer and reply action bar live behind auth).
// In CI, provide E2E_EMAIL + E2E_PASSWORD secrets (or a saved E2E_STORAGE_STATE)
// so the full mobile suite runs on every pull request.
test.describe("signed-in chat workspace (mobile)", () => {
  test.skip(
    !storageState && (!email || !password),
    "Set E2E_STORAGE_STATE (recommended) or E2E_EMAIL/E2E_PASSWORD to run the mobile chat checks"
  );

  if (storageState) {
    test.use({ storageState });
  }

  test("chat composer: send button on-screen, toolbar scrolls, pickers are touch-friendly", async ({
    page,
  }) => {
    const errors = captureErrors(page);
    await openNewChatMobile(page);

    // The app shell itself must not overflow horizontally.
    await expectNoHorizontalOverflow(page, "/chat/[id]");

    // Mobile bottom nav is present and the composer is usable.
    await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();
    const composer = page.getByLabel("Message input");
    await expect(composer).toBeEnabled();

    // Regression: the send button used to be pushed off-screen by the toolbar.
    // It must be fully inside the viewport on the right edge.
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

    // The composer toolbar left group must be horizontally scrollable on mobile
    // (instead of pushing the send button out of view).
    const toolbarOverflowX = await page.getByLabel("Select tone").evaluate((el) => {
      const scroll = el.closest(".overflow-x-auto") as HTMLElement | null;
      return scroll ? getComputedStyle(scroll).overflowX : null;
    });
    expect(toolbarOverflowX, "toolbar should scroll horizontally on mobile").toBe("auto");

    // Tone picker must open as a touch-friendly bottom sheet and select a tone.
    await page.getByLabel("Select tone").click();
    const sheet = page.getByRole("dialog", { name: "Tone" });
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    const toneOption = page
      .locator('[aria-label^="Select "][aria-label$=" tone"]:not([aria-label="Select tone"])')
      .first();
    await toneOption.waitFor({ timeout: 10_000 });
    const toneLabel =
      (await toneOption.getAttribute("aria-label"))?.replace(/^Select | tone$/g, "") ?? "";
    await toneOption.click();
    await expect(page.getByLabel("Select tone")).toContainText(toneLabel, { timeout: 10_000 });

    // Share menu must open on tap (hover-only menus are unusable on touch).
    await page.getByRole("button", { name: "Share", exact: true }).click();
    await expect(page.getByRole("menuitem", { name: "Copy link" })).toBeVisible({
      timeout: 10_000,
    });
    // Dismiss with a tap outside — the realistic touch gesture (keyboard Escape
    // is unreliable under touch emulation and not how mobile users close menus).
    await page.locator("body").tap({ position: { x: 20, y: 320 } });
    await expect(page.getByRole("menuitem", { name: "Copy link" })).toBeHidden({
      timeout: 10_000,
    });

    assertNoClientErrors(errors.filter((e) => !isEnvironmentalError(e)), "mobile chat workspace");
  });

  test("chat reply: action bar is visible and tappable on touch", async ({ page, context }) => {
    test.setTimeout(300_000);
    const errors = captureErrors(page);
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: process.env.E2E_ORIGIN ?? "http://127.0.0.1:3100",
    });
    await openNewChatMobile(page);

    // Send a message and wait for the AI run to finish (best effort — streaming
    // can be slow, and the free-plan quota may refuse under parallel load).
    const msg = `Mobile action bar ${Date.now()}`;
    const composer = page.getByLabel("Message input");
    await composer.fill(msg);
    await page.getByRole("button", { name: "Send message" }).click();
    await page.getByText(msg, { exact: false }).first().waitFor({ timeout: 20_000 });
    await page
      .waitForFunction(
        () => !document.querySelector('[aria-label="Stop generating"]'),
        null,
        { timeout: 150_000 }
      )
      .catch(() => {});

    // The assistant note only renders from server data — its presence means the
    // run landed (same signal as chat-flow.spec.ts).
    const assistantNotes = page.locator('[class*="border-l-2"]');
    if ((await assistantNotes.count()) === 0) {
      test.skip(true, "no assistant reply produced (quota/provider) — action bar not exercised");
      return;
    }

    const note = assistantNotes.last();
    const before = await note.innerText().catch(() => "");
    const copyBtn = page.getByRole("button", { name: "Copy", exact: true }).last();
    const regenBtn = page.getByRole("button", { name: "Regenerate", exact: true }).last();

    // Touch regression: on mobile the action bar must be visible WITHOUT hover
    // (no mouse events to reveal it), and the buttons must be tappable. Also
    // assert they are actually ON-SCREEN (toBeVisible passes for an element
    // scrolled off the viewport — the original "buttons not working" symptom).
    await expect(copyBtn).toBeVisible({ timeout: 10_000 });
    await expect(regenBtn).toBeVisible({ timeout: 10_000 });
    const viewport = page.viewportSize();
    const copyBox = await copyBtn.boundingBox();
    const regenBox = await regenBtn.boundingBox();
    expect(copyBox, "Copy button should have a bounding box").not.toBeNull();
    expect(regenBox, "Regenerate button should have a bounding box").not.toBeNull();
    expect(viewport, "viewport size should be available").not.toBeNull();
    if (!copyBox || !regenBox || !viewport)
      throw new Error("missing action-bar geometry or viewport size");
    for (const [label, box] of [
      ["Copy", copyBox],
      ["Regenerate", regenBox],
    ] as const) {
      expect(box.x, `${label} should not start off-screen left`).toBeGreaterThanOrEqual(0);
      expect(
        box.x + box.width,
        `${label} should not extend past the right edge of the viewport`
      ).toBeLessThanOrEqual(viewport.width + 1);
    }

    // The action bar is a new on-screen element — it must not introduce overflow.
    await expectNoHorizontalOverflow(page, "chat reply action bar");

    // Copy tap → the reply lands in the clipboard.
    await copyBtn.tap();
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    expect(clip.length, "Copy should write non-empty text to the clipboard").toBeGreaterThan(0);

    // Regenerate tap → the API request must fire and answer; on success the flow
    // completes with a "Regenerated" toast or a visibly changed reply.
    const regenResponsePromise = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        /\/messages\/[^/]+\/regenerate$/.test(new URL(r.url()).pathname),
      { timeout: 120_000 }
    );
    await regenBtn.tap();
    const regenResponse = await regenResponsePromise;
    // A 5xx on the primary action is the exact "regenerate not working"
    // regression this test exists to catch — but 502/503 provider gateway
    // hiccups are environmental (same convention as the console-error filter
    // above), as are 429/403 quota refusals.
    const status = regenResponse.status();
    const environmentalStatus = [429, 403, 502, 503].includes(status);
    if (status >= 500 && !environmentalStatus) {
      throw new Error(`regenerate returned HTTP ${status} — the endpoint is broken`);
    }

    if (status === 200) {
      // waitForResponse resolves on headers; regenerate streams its body, so
      // consume the full body before measuring UI completion below.
      await regenResponse.text().catch(() => "");
      const deadline = Date.now() + 20_000;
      let completed = false;
      while (Date.now() < deadline && !completed) {
        const toastHit = await page.getByText("Regenerated", { exact: true }).count();
        const now = await note.innerText().catch(() => "");
        if (toastHit > 0 || (now && now !== before)) completed = true;
        else await page.waitForTimeout(1_000);
      }
      expect(completed, "regenerate should complete with a toast or a changed reply").toBe(true);
    }
    // Non-200 but sub-500 (429/403 quota) is environmental — same tolerance as
    // chat-flow; 502/503 was already ruled out above as environmental too.

    assertNoClientErrors(errors.filter((e) => !isEnvironmentalError(e)), "mobile reply action bar");
  });
});
