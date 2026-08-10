// Provision the LIVE Paddle Billing account for ToneCraft.
//
// Creates (idempotently, skipping anything that already exists):
//   1. Products:  "Pro"  and "Enterprise"
//   2. Prices:    Pro $6/mo, Pro $57.60/yr, Enterprise $15/mo, Enterprise $144/yr (USD, internal tax)
//   3. Webhook:   https://tonecraft-psi.vercel.app/api/billing/webhook
//                 subscribed to exactly the events src/app/api/billing/webhook/route.ts acts on
//
// Usage:  PADDLE_API_KEY=pdl_live_... node scripts/setup-live-paddle.js
//
// Prints the price IDs + webhook secret to paste into Vercel env vars. Never prints the API key.
const { Paddle, Environment } = require("@paddle/paddle-node-sdk");

const apiKey = process.env.PADDLE_API_KEY;
if (!apiKey) {
  console.error("PADDLE_API_KEY is required. Set it in the environment first.");
  process.exit(1);
}
if (!apiKey.startsWith("pdl_live_")) {
  console.error("This script is for the LIVE account. Refusing to run against a sandbox key.");
  process.exit(1);
}

const WEBHOOK_URL = "https://tonecraft-psi.vercel.app/api/billing/webhook";

// Exactly the events the webhook route + PaddleProvider.mapEventType act on.
const WEBHOOK_EVENTS = [
  "subscription.created",
  "subscription.activated",
  "subscription.updated",
  "subscription.canceled",
  "subscription.past_due",
  "transaction.completed",
  "transaction.paid",
  "transaction.payment_failed",
];

const paddle = new Paddle(apiKey, { environment: Environment.production });

const PLAN_PRICES = [
  { product: "Pro", name: "Pro — Monthly", amount: "600", interval: "month", frequency: 1 },
  { product: "Pro", name: "Pro — Annual", amount: "5760", interval: "year", frequency: 1 },
  { product: "Enterprise", name: "Enterprise — Monthly", amount: "1500", interval: "month", frequency: 1 },
  { product: "Enterprise", name: "Enterprise — Annual", amount: "14400", interval: "year", frequency: 1 },
];

async function findProduct(name) {
  for await (const p of paddle.products.list({ status: ["active", "archived"] })) {
    if (p.name.toLowerCase() === name.toLowerCase()) return p;
  }
  return null;
}

async function findPrice(productId, interval) {
  for await (const px of paddle.prices.list({ productId, status: ["active", "archived"] })) {
    if (px.billingCycle?.interval === interval) return px;
  }
  return null;
}

async function findWebhook() {
  const settings = await paddle.notificationSettings.list({});
  return settings.find((s) => s.destination === WEBHOOK_URL) ?? null;
}

(async () => {
  console.log("Connected to:", apiKey.startsWith("pdl_live_") ? "Paddle LIVE" : "?");
  console.log("---");

  // 1. Products
  const products = {};
  for (const name of ["Pro", "Enterprise"]) {
    let product = await findProduct(name);
    if (!product) {
      product = await paddle.products.create({
        name,
        // `standard` is the only tax category pre-approved on a new live account.
        // Once tax registration (Paddle dashboard → Tax settings) is approved,
        // switch this to "digital-goods" — it only affects how Paddle applies tax,
        // not the price IDs, so it can be changed later without breaking anything.
        taxCategory: "standard",
        description: `${name} plan for ToneCraft`,
      });
      console.log(`CREATED product: ${name} -> ${product.id}`);
    } else {
      console.log(`FOUND  product: ${name} -> ${product.id} (status ${product.status})`);
    }
    products[name] = product;
  }

  // 2. Prices
  const priceIds = {};
  for (const p of PLAN_PRICES) {
    const existing = await findPrice(products[p.product].id, p.interval);
    if (existing) {
      console.log(`FOUND  price: ${p.name} -> ${existing.id} (${existing.unitPrice.amount} ${existing.unitPrice.currencyCode})`);
      priceIds[`${p.product}:${p.interval}`] = existing.id;
      continue;
    }
    const created = await paddle.prices.create({
      productId: products[p.product].id,
      name: p.name,
      description: `${p.product} — ${p.interval}ly billing`,
      billingCycle: { interval: p.interval, frequency: p.frequency },
      unitPrice: { amount: p.amount, currencyCode: "USD" },
      taxMode: "internal",
    });
    console.log(`CREATED price: ${p.name} -> ${created.id} (${created.unitPrice.amount} ${created.unitPrice.currencyCode})`);
    priceIds[`${p.product}:${p.interval}`] = created.id;
  }

  // 3. Webhook
  let webhook = await findWebhook();
  if (!webhook) {
    webhook = await paddle.notificationSettings.create({
      description: "ToneCraft production webhook",
      destination: WEBHOOK_URL,
      type: "url",
      subscribedEvents: WEBHOOK_EVENTS,
    });
    console.log(`CREATED webhook: ${webhook.id} -> ${webhook.destination}`);
  } else {
    console.log(`FOUND  webhook: ${webhook.id} -> ${webhook.destination}`);
  }

  // 4. Env-var output
  console.log("\n=== VERCEL ENV VARS TO SET (tonecraft-psi, Production) ===");
  console.log(`PADDLE_PRICE_PRO=${priceIds["Pro:month"]}`);
  console.log(`PADDLE_PRICE_PRO_ANNUAL=${priceIds["Pro:year"]}`);
  console.log(`PADDLE_PRICE_ENTERPRISE=${priceIds["Enterprise:month"]}`);
  console.log(`PADDLE_PRICE_ENTERPRISE_ANNUAL=${priceIds["Enterprise:year"]}`);
  console.log(`PADDLE_WEBHOOK_SECRET=${webhook.endpointSecretKey}`);
  console.log("\n(All values are from the LIVE account — safe for production.)");
})().catch((e) => {
  console.error("FATAL:", e.message, e.detail || "");
  if (e.detail && Array.isArray(e.detail)) {
    for (const d of e.detail) console.error("  -", d.field || d.code, d.message || "");
  }
  process.exit(1);
});
