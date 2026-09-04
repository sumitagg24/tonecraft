/**
 * Dodo Sandbox end-to-end checkout driver.
 *
 * Verifies, against a LOCAL ToneCraft server wired to the Dodo SANDBOX
 * (test_mode) merchant:
 *   1. POST /api/billing/checkout resolves plan -> product and returns a real
 *      Dodo checkout URL (session creation).
 *   2. The resolved product id actually exists in the sandbox catalog.
 *   3. Paying with a sandbox test card completes without a real charge.
 *   4. The app lands back on the return URL and entitlement reflects the plan
 *      (GET /api/billing/customer).
 *
 * Usage (see README.md in this directory for the full recipe):
 *   node scripts/dodo-sandbox/checkout-sandbox.cjs [--plan pro|basic|advanced]
 *       [--interval month|year] [--headed]
 *
 * Auth (same conventions as the e2e suite):
 *   E2E_STORAGE_STATE=./.auth/state.json   (pre-saved Clerk session)  [recommended]
 *   …or E2E_EMAIL + E2E_PASSWORD           (interactive Clerk login)
 *
 * Sandbox env is read from .env.sandbox at the repo root (see env.sandbox.example)
 * so sandbox keys never touch .env.local.
 */
const { chromium, devices } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3100";
const STATE_PATH = path.join(ROOT, ".auth", "state.json");
const SANDBOX_ENV_FILE = path.join(ROOT, ".env.sandbox");

const args = process.argv.slice(2);
const PLAN = args.includes("--plan") ? args[args.indexOf("--plan") + 1] : "pro";
const INTERVAL = args.includes("--interval") ? args[args.indexOf("--interval") + 1] : "month";
const HEADED = args.includes("--headed");

// Success + decline sandbox cards (docs.dodopayments.com/miscellaneous/testing-process)
const TEST_CARD = process.env.DODO_TEST_CARD || "4242 4242 4242 4242";
const TEST_EXPIRY = process.env.DODO_TEST_EXPIRY || "06/32";
const TEST_CVV = process.env.DODO_TEST_CVV || "123";

function loadSandboxEnv() {
  if (!fs.existsSync(SANDBOX_ENV_FILE)) {
    console.error(`Missing ${SANDBOX_ENV_FILE} — copy scripts/dodo-sandbox/env.sandbox.example and fill it in.`);
    process.exit(1);
  }
  const env = {};
  for (const raw of fs.readFileSync(SANDBOX_ENV_FILE, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return env;
}

async function login(page, sandbox) {
  if (fs.existsSync(STATE_PATH)) {
    // Reuse the saved session: boot, refresh, and re-save (mirrors refresh-e2e-session.cjs).
    await page.goto(`${BASE_URL}/chat`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(6_000);
    const ok =
      page.url().includes("/chat") &&
      !page.url().includes("/sign-in") &&
      !page.url().includes("chrome-error");
    if (!ok) {
      console.error(`Saved session at ${STATE_PATH} no longer signs in (landed on ${page.url()}). Re-capture it or use E2E_EMAIL/E2E_PASSWORD.`);
      process.exit(1);
    }
    await page.context().storageState({ path: STATE_PATH });
    return;
  }
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    console.error("No auth: set E2E_STORAGE_STATE or E2E_EMAIL + E2E_PASSWORD.");
    process.exit(1);
  }
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "networkidle" });
  await page.getByPlaceholder(/enter your email/i).waitFor({ timeout: 20_000 });
  await page.getByPlaceholder(/enter your email/i).fill(email);
  await page.getByPlaceholder(/enter your password/i).fill(password);
  await page.getByRole("button", { name: /^continue$/i }).click();
  try {
    await page.waitForURL("**/chat**", { timeout: 45_000 });
  } catch {
    console.error("Sign-in did not land on /chat (Clerk dev instance may demand email verification — use E2E_STORAGE_STATE).");
    process.exit(1);
  }
}

async function createCheckout(page) {
  console.log(`\n[1/4] Creating ${INTERVAL}ly '${PLAN}' checkout session…`);
  const res = await page.request.post(`${BASE_URL}/api/billing/checkout`, {
    data: { plan: PLAN, interval: INTERVAL },
  });
  const body = await res.json();
  if (res.status() === 409) {
    console.error(`→ 409: the test account already has an active subscription. Cancel it first (billing page) or use a fresh account.`);
    process.exit(2);
  }
  if (!res.ok() || !body?.data?.url) {
    console.error(`→ Checkout failed (HTTP ${res.status()}):`, JSON.stringify(body));
    process.exit(2);
  }
  const url = body.data.url;
  console.log(`→ Session created OK (HTTP ${res.status()})`);
  console.log(`→ checkout_url: ${url}`);
  return url;
}

async function verifyProductInCatalog(url, sandbox) {
  console.log("\n[2/4] Cross-checking the resolved product against the sandbox catalog…");
  const apiKey = sandbox.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    console.log("→ (no DODO_PAYMENTS_API_KEY in .env.sandbox — skipping catalog cross-check)");
    return;
  }
  const DodoPayments = require("dodopayments");
  const client = new DodoPayments({ bearerToken: apiKey, environment: "test_mode" });
  try {
    const products = [];
    for await (const p of client.products.list()) products.push(p);
    const query = url.match(/[?&]product_id=([^&]+)/);
    const names = products.map((p) => p.product_id).join(",");
    const hint = query ? ` (url queries product_id=${query[1]})` : "";
    console.log(`→ Sandbox catalog has ${products.length} product(s)${hint}`);
    for (const p of products.slice(0, 10)) console.log(`   - ${p.product_id}  ${p.name || ""}`);
    if (query && !names.includes(query[1])) {
      console.warn(`⚠️  The product id in the checkout URL was NOT found in the sandbox catalog. The ids in .env.sandbox (DODO_PRODUCT_*) must be SANDBOX ids, not live ids.`);
    } else {
      console.log("→ Product id resolves in the sandbox catalog. ✓");
    }
  } catch (e) {
    console.warn(`→ Catalog cross-check failed: ${e.message}`);
  }
}

async function payWithTestCard(page, url) {
  console.log("\n[3/4] Opening Dodo sandbox checkout and paying with the test card…");
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  // The hosted checkout can take a moment to boot its form.
  await page.waitForTimeout(4_000);

  const tryFill = async (selectors, value) => {
    for (const sel of selectors) {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await loc.click().catch(() => {});
        await loc.fill(value).catch(() => {});
        return true;
      }
    }
    return false;
  };

  const filledCard = await tryFill(
    [
      'input[name="cardNumber"]',
      'input[autocomplete="cc-number"]',
      'input[placeholder*="card number" i]',
      'input[inputmode="numeric"][maxlength="19"]',
    ],
    TEST_CARD
  );
  const filledExp = await tryFill(
    ['input[name="expiry"]', 'input[autocomplete="cc-exp"]', 'input[placeholder*="expiry" i]', 'input[placeholder*="MM/YY"]'],
    TEST_EXPIRY
  );
  const filledCvv = await tryFill(
    ['input[name="cvc"]', 'input[autocomplete="cc-csc"]', 'input[placeholder*="cvc" i]', 'input[placeholder*="cvv" i]'],
    TEST_CVV
  );
  if (!(filledCard && filledExp && filledCvv)) {
    console.error("→ Could not locate the card fields on the Dodo checkout page (selectors may need updating).");
    console.error(`  Page URL: ${page.url()}`);
    await page.screenshot({ path: path.join(ROOT, "test-results", "dodo-checkout-failed.png"), fullPage: true }).catch(() => {});
    console.error("  Screenshot: test-results/dodo-checkout-failed.png");
    process.exit(3);
  }
  console.log("→ Card details entered. Submitting…");

  const payLabels = [/^pay\b/i, /^pay now$/i, /complete (payment|purchase)/i, /place order/i, /^submit$/i];
  let submitted = false;
  for (const label of payLabels) {
    const btn = page.getByRole("button", { name: label }).first();
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btn.click();
      submitted = true;
      break;
    }
  }
  if (!submitted) {
    await page.keyboard.press("Enter");
    submitted = true;
  }

  // Sandbox payments resolve in a few seconds; watch for the redirect home.
  const checkoutHost = new URL(url).host;
  try {
    await page.waitForURL((u) => !u.host.includes(checkoutHost), { timeout: 60_000 });
    console.log(`→ Payment accepted — redirected to ${page.url()}`);
  } catch {
    console.error("→ Timed out waiting for redirect after payment. Dumping page state:");
    console.error(`  Page URL: ${page.url()}`);
    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 600)).catch(() => "");
    console.error(`  Body: ${text}`);
    await page.screenshot({ path: path.join(ROOT, "test-results", "dodo-pay-result.png"), fullPage: true }).catch(() => {});
    process.exit(3);
  }
}

async function verifyEntitlement(page, url) {
  console.log("\n[4/4] Verifying post-payment entitlement…");
  // Webhooks are asynchronous (Dodo → your local webhook endpoint). Poll a bit.
  let last = "";
  for (let i = 0; i < 12; i++) {
    const res = await page.request.get(`${BASE_URL}/api/billing/customer`);
    const body = await res.json();
    last = JSON.stringify(body);
    const sub = body?.data?.subscription || body?.data;
    const status = sub?.status || "";
    if (/active|trialing/i.test(status)) {
      console.log(`→ Subscription synced: ${status} (plan: ${sub?.plan || "?"}) ✓`);
      console.log(`  raw: ${last.slice(0, 300)}`);
      return;
    }
    await page.waitForTimeout(5_000);
  }
  console.error("→ Entitlement did not flip to active within 60s. Webhook leg may be misconfigured.");
  console.error(`  Last /api/billing/customer response: ${last.slice(0, 400)}`);
  console.error("  Check that a webhook endpoint for the sandbox merchant points at your local server (see README — dodo wh listen or a tunnel).");
  process.exit(4);
}

async function main() {
  const sandbox = loadSandboxEnv();
  console.log("Loaded sandbox env keys:", Object.keys(sandbox).join(", "));

  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(2_000) });
    if (!res.ok) throw new Error(`status ${res.status}`);
  } catch {
    console.error(`No server on ${BASE_URL}. Start it first (see README).`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({
    ...devices["Desktop Chrome"],
    baseURL: BASE_URL,
    storageState: fs.existsSync(STATE_PATH) ? STATE_PATH : undefined,
  });
  const page = await context.newPage();

  await login(page, sandbox);
  const url = await createCheckout(page);
  await verifyProductInCatalog(url, sandbox);
  await payWithTestCard(page, url);
  await verifyEntitlement(page, url);

  console.log("\n✅ Sandbox checkout E2E passed: session → payment → webhook → entitlement.");
  await browser.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
