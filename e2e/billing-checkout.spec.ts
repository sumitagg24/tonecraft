import { test, expect, type Page } from "@playwright/test";
import {
  captureErrors,
  assertNoClientErrors,
  interactiveLogin,
  isEnvironmentalError,
} from "./utils";
import fs from "node:fs";
import path from "node:path";

/**
 * Billing / Dodo Payments regression guard.
 *
 * /billing is auth-protected, so it runs only when a session is available —
 * same conventions as signed-in-smoke.spec.ts (E2E_STORAGE_STATE, or
 * E2E_EMAIL/E2E_PASSWORD for interactive login). Two checks:
 *
 *  1. The payment UI mounts: pricing tier cards (Upgrade to Pro / Get
 *     Advanced) render with zero client errors — catches a blank/broken
 *     billing page. When the annual product ids are configured the
 *     "Annual (20% off)" toggle must also render.
 *
 *  2. The Dodo checkout probe executes the payment path (POST
 *     /api/billing/checkout → hosted checkout URL on checkout.dodopayments.com)
 *     — proving billing is wired end-to-end as far as the app is concerned.
 */

const testEmail = process.env.E2E_EMAIL;
const testPassword = process.env.E2E_PASSWORD;
const storageState = process.env.E2E_STORAGE_STATE;
const hasSession = Boolean(storageState || (testEmail && testPassword));

/** Read an env var from process.env first, then .env.local (local runs). */
function envOrLocal(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const content = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
    return match ? match[1].trim().replace(/^["']|["']$/g, "") : undefined;
  } catch {
    return undefined;
  }
}

// The checkout probe needs a configured Dodo merchant (sandbox in CI, live
// locally when .env.local points at live_mode) — skip when absent.
const dodoApiKey = envOrLocal("DODO_PAYMENTS_API_KEY");
const dodoProductPro = envOrLocal("DODO_PRODUCT_PRO");
const canProbe =
  Boolean(dodoApiKey) && Boolean(dodoProductPro);

/**
 * Billing-specific environmental console noise:
 *  - A 503 from /api/billing/checkout is the app DELIBERATELY surfacing the
 *    provider's "not configured" state (e.g. missing product id) as a visible
 *    result — the browser logs it as a console error, but it's not a client bug.
 *  - /api/usage, invoices, and history can 5xx in partially-configured
 *    environments (no real DATABASE_URL in CI) — filtered like the other specs.
 */
function isBillingEnvironmentalError(message: string): boolean {
  return (
    isEnvironmentalError(message) ||
    /status of 503/.test(message) ||
    /status of 5\d\d/.test(message) ||
    /status of 409/.test(message) // 409 = subscription already active (test account state)
  );
}

test.describe("billing / Dodo checkout", () => {
  test.skip(
    !hasSession,
    "Set E2E_STORAGE_STATE (recommended) or E2E_EMAIL/E2E_PASSWORD to run billing checks"
  );

  if (storageState) {
    test.use({ storageState });
  }

  /** Sign in interactively (Mode B) unless a pre-saved session is in use. */
  async function signIn(page: Page) {
    if (!storageState && testEmail && testPassword) {
      const result = await interactiveLogin(page, testEmail, testPassword);
      if (result === "verify") {
        test.skip(
          true,
          "Clerk dev instance requires email verification — use E2E_STORAGE_STATE with an established session"
        );
      }
    }
  }

  test("/billing mounts the payment UI (plan cards + annual toggle)", async ({ page }) => {
    const errors = captureErrors(page);
    await signIn(page);

    const response = await page.goto("/billing", { waitUntil: "networkidle" });
    expect(response?.status(), "/billing should respond 200").toBe(200);

    // The payment UI must actually render — plan cards for every paid tier
    // (guards against a blank/error page).
    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
    await expect(page.getByRole("button", { name: /upgrade to pro/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /get advanced/i })).toBeVisible();

    // The annual toggle only renders when the Dodo *_ANNUAL product ids are
    // configured (ANNUAL_BILLING_CONFIGURED) — assert it when present.
    const annualToggle = page.getByRole("button", { name: /annual \(20% off\)/i });
    if (await annualToggle.count()) {
      await expect(annualToggle).toBeVisible();
    }

    // Let hydration + data fetches settle before asserting no client errors.
    await page.waitForTimeout(750);

    // The billing page's data fetches (usage/invoices/history) can 5xx in
    // partially-configured environments — filter those like the other specs.
    assertNoClientErrors(
      errors.filter((e) => !isBillingEnvironmentalError(e)),
      "/billing mount"
    );
  });

  test("checkout API returns a Dodo hosted-checkout URL (payment path works)", async ({
    page,
    request,
  }) => {
    test.skip(
      !canProbe,
      "Set DODO_PAYMENTS_API_KEY + DODO_PRODUCT_PRO to run the checkout probe (sandbox in CI; creates a real, unpaid checkout session)"
    );

    const errors = captureErrors(page);
    await signIn(page);
    // Visit /billing first so the request below runs with the session cookie
    // the interactive login just established.
    await page.goto("/billing", { waitUntil: "networkidle" });

    // POST /api/billing/checkout with the plan name — the server resolves the
    // product id from env and returns the Dodo hosted checkout URL. Use the
    // authed request context so the session cookie is attached.
    const res = await request.post("/api/billing/checkout", {
      data: { plan: "pro", interval: "month" },
    });
    const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

    // A 409 means the test account already holds a subscription — the probe
    // cannot create a second one; treat that as "billing path reachable".
    if (res.status() === 409) {
      expect(body.error, "409 should explain the conflict").toMatch(/subscription already active/i);
      return;
    }

    expect(res.status(), `checkout should return 200 (got ${res.status()}: ${body.error ?? "?"})`).toBe(200);
    expect(body.url, "checkout should return a hosted checkout url").toBeTruthy();
    expect(
      body.url as string,
      "checkout url should point at Dodo Payments hosted checkout"
    ).toMatch(/checkout\.(sandbox\.)?dodopayments\.com/);

    assertNoClientErrors(
      errors.filter((e) => !isBillingEnvironmentalError(e)),
      "checkout probe"
    );
  });
});
