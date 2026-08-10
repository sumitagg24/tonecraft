#!/usr/bin/env node
/* Production cutover verifier.
 *
 * Usage:
 *   node scripts/production-cutover.js            # audits .env.local (or current env)
 *   PADDLE_API_KEY=... node scripts/production-cutover.js --verify-paddle
 *
 * Checks every service for production readiness (key prefixes, placeholder
 * detection, live price existence) without ever printing secret values.
 */
const fs = require("fs");
const https = require("https");

const FILE = ".env.local";
const env = {};
if (fs.existsSync(FILE)) {
  for (const l of fs.readFileSync(FILE, "utf8").split("\n")) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
// Do NOT let ambient shell env shadow the file (a stale placeholder in the
// shell environment would hide the real value in .env.local). Explicit
// command-line overrides for --verify-paddle read process.env directly.

const prodRequired = [
  { key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", ok: (v) => /^pk_live_/.test(v), want: "pk_live_…" },
  { key: "CLERK_SECRET_KEY", ok: (v) => /^sk_live_/.test(v), want: "sk_live_…" },
  { key: "CLERK_WEBHOOK_SECRET", ok: (v) => /^whsec_/.test(v) && !/your-|placeholder/i.test(v), want: "whsec_… (production webhook)" },
  { key: "PADDLE_API_KEY", ok: (v) => /^pdl_live_/.test(v), want: "pdl_live_…" },
  { key: "PADDLE_WEBHOOK_SECRET", ok: (v) => /^pdl_ntfset_/.test(v), want: "pdl_ntfset_…" },
  { key: "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", ok: (v) => !v.startsWith("test_") && v.length > 20, want: "live token (no test_ prefix)" },
  { key: "PADDLE_CLIENT_TOKEN", ok: (v) => !v.startsWith("test_") && v.length > 20, want: "live token (no test_ prefix)" },
  { key: "PADDLE_PRICE_PRO", ok: (v) => /^pri_/.test(v), want: "pri_… (live price)" },
  { key: "PADDLE_PRICE_PRO_ANNUAL", ok: (v) => /^pri_/.test(v), want: "pri_… (live price)" },
  { key: "PADDLE_PRICE_ENTERPRISE", ok: (v) => /^pri_/.test(v), want: "pri_… (live price)" },
  { key: "PADDLE_PRICE_ENTERPRISE_ANNUAL", ok: (v) => /^pri_/.test(v), want: "pri_… (live price)" },
  { key: "NEXT_PUBLIC_APP_URL", ok: (v) => /^https:\/\//.test(v), want: "https://tonecraft-psi.vercel.app" },
  { key: "R2_ACCOUNT_ID", ok: (v) => v.length > 10 && v !== "...", want: "Cloudflare account id (32 hex)" },
  { key: "R2_ACCESS_KEY_ID", ok: (v) => v.length > 10 && v !== "...", want: "R2 access key id" },
  { key: "R2_SECRET_ACCESS_KEY", ok: (v) => v.length > 10 && v !== "...", want: "R2 secret access key" },
  { key: "R2_BUCKET_NAME", ok: (v) => v.length > 3 && v !== "...", want: "bucket name (e.g. tonecraft-uploads)" },
  { key: "R2_PUBLIC_URL", ok: (v) => /^https:\/\//.test(v) && v !== "...", want: "https://pub-….r2.dev" },
  { key: "DATABASE_URL", ok: (v) => /postgres(ql)?:\/\//.test(v), want: "Neon pooled connection string" },
  { key: "DIRECT_URL", ok: (v) => /postgres(ql)?:\/\//.test(v), want: "Neon direct connection string" },
  { key: "CRON_SECRET", ok: (v) => v.length >= 32, want: "random secret (≥32 chars)" },
  { key: "UPSTASH_REDIS_REST_URL", ok: (v) => /^https:\/\//.test(v) && !/\.\.\./.test(v), want: "https://…upstash.io" },
  { key: "UPSTASH_REDIS_REST_TOKEN", ok: (v) => v.length > 20, want: "upstash token" },
];

const optional = [
  "GROQ_API_KEY", "OPENROUTER_API_KEY", "GOOGLE_AI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY",
  "SENTRY_DSN", "SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT",
];

function mask(v) {
  // print only the class prefix (e.g. pdl_sdbx_, pk_test_, test_) + length —
  // never any actual key material
  if (!v) return "(missing)";
  const m = v.match(/^(pdl_(?:sdbx|live)_|pk_(?:test|live)_|sk_(?:test|live)_|whsec_|pri_|test_)/);
  return (m ? m[1] + "…" : "set…") + "(" + v.length + ")";
}

let pass = 0, fail = 0;
console.log("=== PRODUCTION CUTOVER CHECK ===");
for (const c of prodRequired) {
  const v = env[c.key];
  const ok = !!v && c.ok(v);
  if (ok) pass++; else fail++;
  console.log((ok ? "✅" : "❌") + " " + c.key.padEnd(36) + (ok ? "OK" : "NEEDS: " + c.want) + (v ? "  [" + mask(v) + "]" : ""));
}
console.log("\n=== OPTIONAL PROVIDERS (at least one LLM key required) ===");
for (const k of optional) {
  const v = env[k];
  const placeholder = !v || /your-|placeholder|^\.\.\.$/.test(v);
  if (!placeholder) pass++;
  console.log((placeholder ? "⚠️" : "✅") + " " + k.padEnd(32) + (placeholder ? (v ? "PLACEHOLDER: " + mask(v) : "MISSING") : "set"));
}
console.log("\nRESULT: " + pass + " ok, " + fail + " need attention");

async function verifyLivePaddle() {
  const apiKey = process.env.PADDLE_API_KEY || env.PADDLE_API_KEY;
  if (!/^pdl_live_/.test(apiKey)) {
    console.log("\n⚠️  --verify-paddle requires a LIVE Paddle API key (pdl_live_…).");
    process.exit(1);
  }
  const base = "api.paddle.com";
  const priceKeys = ["PADDLE_PRICE_PRO", "PADDLE_PRICE_PRO_ANNUAL", "PADDLE_PRICE_ENTERPRISE", "PADDLE_PRICE_ENTERPRISE_ANNUAL"];
  console.log("\n=== LIVE PADDLE PRICE VERIFICATION (api.paddle.com) ===");
  for (const k of priceKeys) {
    const id = env[k];
    if (!id) { console.log("⚠️ " + k + " not set"); continue; }
    await new Promise((resolve) => {
      const r = https.request(
        { hostname: base, path: "/prices/" + id, method: "GET", headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" } },
        (res) => {
          let d = "";
          res.on("data", (c) => (d += c));
          res.on("end", () => {
            try {
              const j = JSON.parse(d);
              const p = j.data;
              if (p) console.log("✅ " + k.padEnd(32) + id + "  " + p.name + "  " + (p.unit_price ? p.unit_price.amount + " " + p.unit_price.currency_code : "") + "  [" + p.status + "]");
              else console.log("❌ " + k.padEnd(32) + id + "  NOT FOUND in live account");
            } catch (e) {
              console.log("❌ " + k.padEnd(32) + " error: " + d.slice(0, 120));
            }
            resolve();
          });
        }
      );
      r.on("error", (e) => { console.log("❌ " + k + " " + e.message); resolve(); });
      r.end();
    });
  }
}

(async () => {
  if (process.argv.includes("--verify-paddle")) {
    await verifyLivePaddle();
  }
})();
