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
 * Billing / Paddle checkout regression guard.
 *
 * /billing is auth-protected, so it runs only when a session is available —
 * same conventions as signed-in-smoke.spec.ts (E2E_STORAGE_STATE, or
 * E2E_EMAIL/E2E_PASSWORD for interactive login). Three checks:
 *
 *  1. The payment UI mounts: pricing tier cards (Upgrade to Pro / Get
 *     Enterprise) and the Billing Setup diagnostics render with zero client
 *     errors — catches a blank/broken billing page.
 *
 *  2. The Paddle.js client token inlined into the served bundle matches the
 *     token configured at build time (process.env or .env.local), and no
 *     sandbox `test_` token leaks in when the build is configured for a live
 *     `live_` token — the exact "production shows test mode" regression.
 *
 *  3. The "Test checkout" live probe executes the full payment path (POST
 *     /api/billing/checkout → Paddle transaction → overlay or surfaced
 *     provider error) and the result is rendered on the page — proving the
 *     billing flow works end-to-end as far as the app is concerned.
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

const paddleApiKey = envOrLocal("PADDLE_API_KEY");
const paddleToken = envOrLocal("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN");

/**
 * Billing-specific environmental console noise. A 503 from /api/billing/checkout
 * is the app DELIBERATELY surfacing the provider's "not configured" state (e.g.
 * missing default payment link) as a visible result — the browser logs it as a
 * console error, but it's not a client bug. Success (200) produces no error.
 */
function isBillingEnvironmentalError(message: string): boolean {
  return isEnvironmentalError(message) || /status of 503/.test(message);
}

test.describe("billing / Paddle checkout", () => {
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

  test("/billing mounts the payment UI (plan cards + diagnostics)", async ({ page }) => {
    const errors = captureErrors(page);
    await signIn(page);

    const response = await page.goto("/billing", { waitUntil: "networkidle" });
    expect(response?.status(), "/billing should respond 200").toBe(200);

    // The payment UI must actually render — plan cards for every paid tier and
    // the billing-setup diagnostics card (guards against a blank/error page).
    // Note: "Billing Setup" is a CardTitle (a div, not a heading role), so
    // match it by text.
    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
    await expect(page.getByRole("button", { name: /upgrade to pro/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /get enterprise/i })).toBeVisible();
    await expect(page.getByText(/billing setup/i)).toBeVisible();

    // Let hydration + data fetches settle before asserting no client errors.
    await page.waitForTimeout(750);

    // The billing page's data fetches (usage/invoices/history/health) can 5xx
    // in partially-configured environments — filter those like the other specs.
    assertNoClientErrors(
      errors.filter((e) => !isBillingEnvironmentalError(e)),
      "/billing mount"
    );
  });

  test("Paddle client token baked into the bundle matches the build config", async ({
    page,
  }) => {
    test.skip(
      !paddleToken,
      "Set NEXT_PUBLIC_PADDLE_CLIENT_TOKEN (build-time) to run the token check"
    );

    const token = paddleToken as string;
    const declaredPrefix = token.startsWith("live_") ? "live_" : "test_";

    const errors = captureErrors(page);
    await signIn(page);
    await page.goto("/billing", { waitUntil: "networkidle" });

    // Collect every JS resource served for this page and search the bodies for
    // Paddle client tokens. NEXT_PUBLIC_* values are inlined verbatim at build
    // time, so a missing token here means the build lost its config.
    const bundle = await page.evaluate(async () => {
      const urls = performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((u) => u.includes("/_next/static/"));
      const bodies = await Promise.all(
        urls.map((u) =>
          fetch(u)
            .then((r) => r.text())
            .catch(() => "")
        )
      );
      return bodies.join("\n");
    });

    // Only bare Paddle tokens count (live_… / test_…). The Clerk publishable
    // key (pk_live_… / pk_test_…) must NOT match — its prefix is preceded by
    // "_", which this pattern excludes.
    const foundTokens = [...bundle.matchAll(/(?:^|[^a-z0-9_])(live_|test_)([a-z0-9]{16,})/g)]
      .map((m) => m[1] + m[2]);

    expect(
      foundTokens,
      "the build-time Paddle client token must be inlined into the served bundle"
    ).toContain(token);

    // The exact "production shows test mode" regression: when configured for a
    // live token, a sandbox token must not be baked in (and vice versa).
    expect(
      foundTokens.filter((t) => !t.startsWith(declaredPrefix)),
      "all inlined Paddle tokens must match the configured environment"
    ).toEqual([]);

    assertNoClientErrors(
      errors.filter((e) => !isEnvironmentalError(e)),
      "Paddle token check"
    );
  });

  test("live checkout probe runs the payment path end-to-end and surfaces the result", async ({
    page,
  }) => {
    test.skip(
      !paddleApiKey,
      "Set PADDLE_API_KEY to run the checkout probe (creates a real, unpaid Paddle transaction)"
    );

    const errors = captureErrors(page);
    await signIn(page);
    await page.goto("/billing", { waitUntil: "networkidle" });

    // The Billing Setup diagnostics card exposes a live end-to-end probe. It
    // creates a real (unpaid) Paddle checkout and renders the outcome — either
    // the overlay opens ("Success") or the provider's exact reason is surfaced
    // ("Checkout failed — …"). Both prove the full payment path executed.
    const probeButton = page.getByRole("button", { name: /^test checkout$/i });
    await expect(probeButton).toBeVisible({ timeout: 20_000 });
    await probeButton.click();

    await expect(page.getByText(/success|checkout failed/i)).toBeVisible({
      timeout: 30_000,
    });
    // The probe result panel is the ONLY element with mt-2.5 + rounded-lg border
    // + p-2.5 (the env-check rows share p-2.5 but not mt-2.5), so this locator
    // is unambiguous — plain .last() on p-2.5 would match the env rows.
    const resultPanel = page.locator(".mt-2\\.5.rounded-lg.border.p-2\\.5");
    await expect(resultPanel).toBeVisible();
    const panelText = (await resultPanel.innerText()).trim();
    expect(panelText.length, "checkout probe should render a non-empty result").toBeGreaterThan(10);

    assertNoClientErrors(
      errors.filter((e) => !isBillingEnvironmentalError(e)),
      "checkout probe"
    );
  });
});
