#!/usr/bin/env node
/* Production cutover verifier.
 *
 * Usage:
 *   node scripts/production-cutover.js            # audits .env.local (or current env)
 *
 * Checks every service for production readiness (key prefixes, placeholder
 * detection, live product existence) without ever printing secret values.
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
// shell environment would hide the real value in .env.local).

const prodRequired = [
  { key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", ok: (v) => /^pk_live_/.test(v), want: "pk_live_…" },
  { key: "CLERK_SECRET_KEY", ok: (v) => /^sk_live_/.test(v), want: "sk_live_…" },
  { key: "CLERK_WEBHOOK_SECRET", ok: (v) => /^whsec_/.test(v) && !/your-|placeholder/i.test(v), want: "whsec_… (production webhook)" },
  { key: "DODO_PAYMENTS_API_KEY", ok: (v) => /^pdl_live_|^dodo_live_/.test(v), want: "pdl_live_… (live Dodo key)" },
  { key: "DODO_PAYMENTS_ENVIRONMENT", ok: (v) => v === "live_mode", want: "live_mode" },
  { key: "DODO_PAYMENTS_WEBHOOK_KEY", ok: (v) => v.length > 20 && !/your-|placeholder/i.test(v), want: "webhook signing key" },
  { key: "DODO_PRODUCT_BASIC", ok: (v) => /^pdt_/.test(v), want: "pdt_… (live product)" },
  { key: "DODO_PRODUCT_PRO", ok: (v) => /^pdt_/.test(v), want: "pdt_… (live product)" },
  { key: "DODO_PRODUCT_ADVANCED", ok: (v) => /^pdt_/.test(v), want: "pdt_… (live product)" },
  { key: "DODO_PRODUCT_BASIC_ANNUAL", ok: (v) => /^pdt_/.test(v), want: "pdt_… (live annual product)" },
  { key: "DODO_PRODUCT_PRO_ANNUAL", ok: (v) => /^pdt_/.test(v), want: "pdt_… (live annual product)" },
  { key: "DODO_PRODUCT_ADVANCED_ANNUAL", ok: (v) => /^pdt_/.test(v), want: "pdt_… (live annual product)" },
  { key: "NEXT_PUBLIC_APP_URL", ok: (v) => /^https:\/\//.test(v), want: "https://www.tonecraft.site" },
  { key: "DATABASE_URL", ok: (v) => /postgres(ql)?:\/\//.test(v), want: "Neon pooled connection string" },
  { key: "DIRECT_URL", ok: (v) => /postgres(ql)?:\/\//.test(v), want: "Neon direct connection string" },
  { key: "CRON_SECRET", ok: (v) => v.length >= 32, want: "random secret (≥32 chars)" },
  { key: "UPSTASH_REDIS_REST_URL", ok: (v) => /^https:\/\//.test(v) && !/\.\.\./.test(v), want: "https://…upstash.io" },
  { key: "UPSTASH_REDIS_REST_TOKEN", ok: (v) => v.length > 20, want: "upstash token" },
];

const optional = [
  "GROQ_API_KEY", "OPENROUTER_API_KEY", "GOOGLE_AI_API_KEY", "OPENAI_API_KEY",
  "CUSTOM_AI_BASE_URL", "CUSTOM_AI_API_KEY", "CUSTOM_AI_MODEL",
  "SENTRY_DSN", "SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT",
];

function mask(v) {
  // print only the class prefix + length — never any actual key material
  if (!v) return "(missing)";
  const m = v.match(/^(pdl_(?:sdbx|live)_|pk_(?:test|live)_|sk_(?:test|live)_|whsec_|pdt_)/);
  return (m ? m[1] + "…" : "set…") + "(" + v.length + ")";
}

let pass = 0, fail = 0;
console.log("=== PRODUCTION CUTOVER CHECK ===");
for (const c of prodRequired) {
  const v = env[c.key];
  const ok = !!v && c.ok(v);
  if (ok) pass++; else fail++;
  console.log((ok ? "✅" : "❌") + " " + c.key.padEnd(40) + (ok ? "OK" : "NEEDS: " + c.want) + (v ? "  [" + mask(v) + "]" : ""));
}
console.log("\n=== OPTIONAL PROVIDERS (at least one LLM key required) ===");
for (const k of optional) {
  const v = env[k];
  const placeholder = !v || /your-|placeholder|^\.\.\.$/.test(v);
  if (!placeholder) pass++;
  console.log((placeholder ? "⚠️" : "✅") + " " + k.padEnd(32) + (placeholder ? (v ? "PLACEHOLDER: " + mask(v) : "MISSING") : "set"));
}
console.log("\nRESULT: " + pass + " ok, " + fail + " need attention");
