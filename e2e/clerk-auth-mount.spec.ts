import { test, expect } from "@playwright/test";
import {
  captureErrors,
  assertNoClientErrors,
  interactiveLogin,
  isEnvironmentalError,
} from "./utils";

/**
 * Auth UI mount regression guard.
 *
 * /sign-in and /sign-up render a server shell (logo + page frame) even when
 * Clerk's JS bundle fails to load — e.g. when the middleware matcher skipped
 * /__clerk/* so Next.js served its own 404 HTML for clerk-js and the browser
 * refused to execute it ("MIME type text/html not executable"), leaving the
 * pages completely blank. A plain "page renders cleanly" assertion
 * (hydration-smoke.spec.ts) passes in that broken state; this spec asserts
 * the Clerk component tree actually mounts and its form is interactive.
 *
 * Selectors are Clerk's stable public DOM contract:
 *   - root component: [data-clerk-component="SignIn" | "SignUp"]
 *   - inputs:         input[name="identifier"] (sign-in), input[name="emailAddress"] (sign-up),
 *                     input[name="password"] (both)
 *   - submit:         "Continue" button
 * The Clerk UI mounts only after its bundle loads AND the frontend API
 * handshake completes, so a visible root with fillable fields is proof the
 * auth pages are truly functional — not just HTTP 200 shells.
 */

const AUTH_PAGES = [
  {
    path: "/sign-in",
    component: "SignIn",
    emailInput: 'input[name="identifier"]',
    passwordInput: 'input[name="password"]',
  },
  {
    path: "/sign-up",
    component: "SignUp",
    emailInput: 'input[name="emailAddress"]',
    passwordInput: 'input[name="password"]',
  },
];

for (const { path, component, emailInput, passwordInput } of AUTH_PAGES) {
  test(`${path} mounts the Clerk ${component} UI (not a blank shell)`, async ({ page }) => {
    const errors = captureErrors(page);

    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status(), `${path} should respond 200`).toBe(200);

    // The Clerk component root mounts only after its JS bundle loads and the
    // frontend API handshake succeeds. Generous timeout: first load fetches
    // clerk-js + initial client state.
    const root = page.locator(`[data-clerk-component="${component}"]`);
    await expect(root, `${path} should mount the Clerk ${component} root`).toBeVisible({
      timeout: 20_000,
    });

    // The form must be interactive — a decorative card that cannot be used is
    // still a broken auth page.
    await expect(page.locator(emailInput)).toBeVisible();
    await expect(page.locator(passwordInput)).toBeVisible();
    await expect(page.getByRole("button", { name: /^continue$/i })).toBeVisible();

    // A refused clerk-js bundle, hydration mismatch, or failed Clerk call all
    // surface as console/page errors and must fail the run.
    assertNoClientErrors(errors, `${path} (Clerk mount)`);
  });
}

// ── Sign-in form submission ─────────────────────────────────────────────
// Goes one step past mounting: fills the real form with a password-verified
// test account (E2E_EMAIL/E2E_PASSWORD, same convention as
// signed-in-smoke.spec.ts) and asserts the submit actually establishes a
// session. Skipped with a hint when no test account is configured, or when
// the Clerk instance demands email verification (cannot be automated).
const testEmail = process.env.E2E_EMAIL;
const testPassword = process.env.E2E_PASSWORD;
const storageState = process.env.E2E_STORAGE_STATE;

test.describe("sign-in form submission", () => {
  test.skip(
    storageState || !testEmail || !testPassword,
    "Set E2E_EMAIL and E2E_PASSWORD (a password-verified test account, no E2E_STORAGE_STATE) to run the sign-in submission check"
  );

  test("/sign-in form submits and establishes a session", async ({ page }) => {
    const errors = captureErrors(page);

    const result = await interactiveLogin(page, testEmail as string, testPassword as string);
    if (result === "verify") {
      test.skip(
        true,
        "Clerk dev instance requires email verification — use E2E_STORAGE_STATE with an established session"
      );
    }

    // Interactive login landed on /chat → the session is real. The app shell
    // must render, then let hydration + effects settle (same convention as
    // signed-in-smoke.spec.ts) before asserting no client errors — a freshly
    // mounted chat workspace can otherwise emit transient console noise.
    await expect(page).toHaveURL(/\/chat/, { timeout: 15_000 });
    await expect(page.locator("body")).not.toBeEmpty();
    await page.waitForTimeout(750);

    // Filter the app's deliberate environmental errors (429 rate limits under
    // parallel load, 502 placeholder-provider keys) from the client-error
    // assertion, same as the other signed-in specs.
    assertNoClientErrors(
      errors.filter((e) => !isEnvironmentalError(e)),
      "sign-in submission"
    );
  });
});
