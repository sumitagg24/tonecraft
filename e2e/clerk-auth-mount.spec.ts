import { test, expect } from "@playwright/test";
import { captureErrors, assertNoClientErrors } from "./utils";

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
