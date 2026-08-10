// Creates annual (yearly) prices for Pro & Enterprise products at 20% off monthly.
// Pro: $6/mo  -> $57.60/yr ; Enterprise: $15/mo -> $144/yr
//
// The Paddle environment follows the API key prefix (pdl_sdbx_ = sandbox,
// pdl_live_ = production), matching the runtime SDK behavior — so the same
// script creates sandbox prices with a sandbox key and LIVE prices with a
// live key.
const { Paddle, Environment } = require("@paddle/paddle-node-sdk");

const apiKey = process.env.PADDLE_API_KEY;
if (!apiKey) {
  console.error("PADDLE_API_KEY is required. Set it in the environment first.");
  process.exit(1);
}
const isSandbox = apiKey.startsWith("pdl_sdbx_");
console.log("Paddle environment:", isSandbox ? "SANDBOX" : "PRODUCTION (live)");

const paddle = new Paddle(apiKey, {
  environment: isSandbox ? Environment.sandbox : Environment.production,
});

async function findProduct(paddleInstance, name) {
  for await (const p of paddleInstance.products.list({ status: ["active"] })) {
    if (p.name.toLowerCase() === name.toLowerCase()) return p;
  }
  return null;
}

async function listPrices(paddleInstance, productId) {
  const out = [];
  for await (const px of paddleInstance.prices.list({ productId, status: ["active"] })) {
    out.push(px);
  }
  return out;
}

(async () => {
  const pro = await findProduct(paddle, "pro");
  const ent = await findProduct(paddle, "enterprise");
  if (!pro || !ent) {
    console.error("Products not found. pro:", !!pro, "enterprise:", !!ent);
    process.exit(1);
  }
  console.log("Products:", pro.id, pro.name, "|", ent.id, ent.name);

  const targets = [
    { product: pro, label: "Pro Annual", amount: "5760", interval: "year", frequency: 1 },
    { product: ent, label: "Enterprise Annual", amount: "14400", interval: "year", frequency: 1 },
  ];

  for (const t of targets) {
    const existing = await listPrices(paddle, t.product.id);
    const already = existing.find(
      (px) => px.billingCycle?.interval === t.interval && px.name?.toLowerCase().includes("annual")
    );
    if (already) {
      console.log("SKIP (exists):", t.label, already.id, already.unitPrice?.amount, already.unitPrice?.currencyCode);
      continue;
    }
    try {
      const created = await paddle.prices.create({
        productId: t.product.id,
        name: t.label,
        description: `${t.product.name} — annual billing (20% off)`,
        billingCycle: { interval: t.interval, frequency: t.frequency },
        unitPrice: { amount: t.amount, currencyCode: "USD" },
        taxMode: "internal",
      });
      console.log("CREATED:", t.label, created.id, created.unitPrice?.amount, created.unitPrice?.currencyCode);
    } catch (e) {
      console.error("FAILED:", t.label, e.message, e.detail || "");
    }
  }
})().catch((e) => {
  console.error("FATAL", e.message, e.detail || "");
  process.exit(1);
});
