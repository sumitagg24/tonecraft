/* Create a live Paddle.js client token via the Billing API (client_token.write). */
const { Paddle, Environment } = require("@paddle/paddle-node-sdk");

const apiKey = process.env.PADDLE_API_KEY;
if (!apiKey) {
  console.error("PADDLE_API_KEY is required.");
  process.exit(1);
}

const paddle = new Paddle(apiKey, { environment: Environment.production });

(async () => {
  try {
    // 1. List existing client tokens
    const listRes = await paddle.clientTokens.list({});
    const existing = Array.isArray(listRes) ? listRes : listRes?.data ?? [];
    console.log("existing client tokens:", existing.length);
    for (const t of existing) {
      console.log(`  - ${t.id} | name="${t.name}" | status=${t.status} | token=${String(t.token).slice(0, 8)}...`);
    }

    // 2. Create a new live client token for ToneCraft production
    const created = await paddle.clientTokens.create({
      name: "ToneCraft production checkout",
      description: "Used by tonecraft-psi.vercel.app for Paddle.js hosted checkout (NEXT_PUBLIC_PADDLE_CLIENT_TOKEN).",
    });
    console.log("\nCREATED client token:");
    console.log("  id:", created.id);
    console.log("  status:", created.status);
    console.log("  token:", created.token);
    console.log("  expires:", created.expiresAt ?? "n/a");
  } catch (e) {
    console.error("FAILED:", e.message);
    if (e.errors) console.error(JSON.stringify(e.errors, null, 2).slice(0, 1200));
    process.exit(1);
  }
})();
