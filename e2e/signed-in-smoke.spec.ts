import { test, expect } from "@playwright/test";
import { captureErrors, assertNoClientErrors } from "./utils";

/**
 * Optional signed-in hydration checks for protected pages (docs, admin,
 * calendar) that cannot be rendered without a session.
 *
 * Skipped in CI by default. Two local modes:
 *
 *   A) Pre-saved session (recommended — dev instances often require email
 *      verification for interactive logins):
 *        E2E_STORAGE_STATE=./.auth/state.json npx playwright test
 *      Capture a session once, in a headed browser:
 *        E2E_STORAGE_STATE=./.auth/state.json E2E_CAPTURE=1 npx playwright test
 *          --headed --grep "save a session"
 *      Sign in manually when the browser opens (including email verification),
 *      and the session is saved to the given path for future runs.
 *
 *   B) Interactive login with a password-verified account:
 *        E2E_EMAIL="you@example.com" E2E_PASSWORD="..." npx playwright test
 *      If the Clerk instance shows "Check your email", the test skips with a
 *      hint to use E2E_STORAGE_STATE instead.
 */

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const storageState = process.env.E2E_STORAGE_STATE;
const capturing = process.env.E2E_CAPTURE === "1";

test.skip(
  !storageState && (!email || !password),
  "Set E2E_STORAGE_STATE (recommended) or E2E_EMAIL/E2E_PASSWORD to run signed-in checks"
);

// Manual session-capture helper: only runs when explicitly requested.
if (storageState && capturing) {
  test("save a session (E2E_CAPTURE)", async ({ page, context }) => {
    test.setTimeout(120_000);
    await page.goto("/sign-in", { waitUntil: "networkidle" });
    await page.getByPlaceholder(/enter your email/i).waitFor({ timeout: 20_000 });
    // Pause so a human can complete sign-in (including email verification).
    await page.waitForTimeout(90_000);
    await context.storageState({ path: storageState });
    // eslint-disable-next-line no-console
    console.log(`Session saved to ${storageState}`);
  });
}

if (storageState) {
  test.use({ storageState });
}

test("protected pages render with no console/hydration errors", async ({ page }) => {
  const errors = captureErrors(page);

  if (!storageState) {
    // Mode B: interactive login.
    await page.goto("/sign-in", { waitUntil: "networkidle" });
    const emailField = page.getByPlaceholder(/enter your email/i);
    await emailField.waitFor({ timeout: 20_000 });
    await emailField.fill(email as string);
    await page.getByPlaceholder(/enter your password/i).fill(password as string);
    await page.getByRole("button", { name: /^continue$/i }).click();
    // Either the session lands on /chat, or the dev instance demands email
    // verification ("Check your email") — which cannot be automated.
    const loginResult = await Promise.race([
      page.waitForURL("**/chat**", { timeout: 45_000 }).then(() => "chat" as const),
      page
        .getByRole("heading", { name: /check your email/i })
        .waitFor({ timeout: 45_000 })
        .then(() => "verify" as const),
    ]);
    if (loginResult === "verify") {
      test.skip(true, "Clerk dev instance requires email verification — use E2E_STORAGE_STATE with an established session");
    }
  }

  for (const path of ["/docs", "/admin", "/calendar", "/settings"]) {
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status(), `${path} should respond 200`).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
    await page.waitForTimeout(750);
  }

  assertNoClientErrors(errors, "protected pages");
});
