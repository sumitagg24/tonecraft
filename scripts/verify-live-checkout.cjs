#!/usr/bin/env node
/* Verify a TONE100LIVE live checkout end-to-end (Paddle + DB).
 *
 * Usage:
 *   PADDLE_API_KEY=pdl_live_... node scripts/verify-live-checkout.cjs
 *
 * Prints masked values only — never full emails or secrets.
 */
const https = require("https");

// ---------- helpers ----------
const maskEmail = (e = "") =>
  e.length < 3 ? e : `${e.slice(0, 2)}***${e.slice(e.indexOf("@"))}`;

function apiGet(path) {
  return new Promise((resolve) => {
    const key = process.env.PADDLE_API_KEY;
    const req = https.request(
      {
        hostname: "api.paddle.com",
        path,
        method: "GET",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          let json = null;
          try { json = JSON.parse(d); } catch { /* ignore */ }
          resolve({ status: res.statusCode, json });
        });
      }
    );
    req.on("error", (e) => resolve({ status: 0, error: e.message }));
    req.end();
  });
}

// ---------- 1. transactions ----------
(async () => {
  console.log("=== 1. RECENT COMPLETED TRANSACTIONS ===");
  const tx = await apiGet("/transactions?status=completed&limit=15");
  if (tx.status !== 200) {
    console.log(`GET /transactions -> HTTP ${tx.status} (permission or auth) ${tx.json?.error?.code ?? ""}`);
  } else {
    const list = tx.json.data ?? [];
    if (!list.length) console.log("(no completed transactions)");
    for (const t of list) {
      const cust = t.customer ?? {};
      console.log(
        `- ${t.id}  ${t.status}  ${t.totals?.subtotal ?? "?"} ${t.currency_code ?? ""}  email=${maskEmail(cust.email)}  ` +
        `created=${(t.created_at ?? "").slice(0, 19)}  sub=${t.subscription_id ?? "none"}  ` +
        `discount=${t.discounts?.[0]?.code ?? "-"}`
      );
    }
  }

  // ---------- 2. subscriptions ----------
  console.log("\n=== 2. RECENT SUBSCRIPTIONS ===");
  const subs = await apiGet("/subscriptions?limit=15");
  if (subs.status !== 200) {
    console.log(`GET /subscriptions -> HTTP ${subs.status} (permission or auth)`);
  } else {
    const list = subs.json.data ?? [];
    if (!list.length) console.log("(no subscriptions)");
    for (const s of list) {
      const price = s.items?.[0]?.price;
      console.log(
        `- ${s.id}  status=${s.status}  customer=${s.customer_id ?? "?"}  ` +
        `price=${price?.id ?? "-"}  items=${s.items?.length ?? 0}`
      );
    }
  }

  // ---------- 3. webhook deliveries ----------
  console.log("\n=== 3. WEBHOOK DELIVERY LOGS (last 10) ===");
  const notif = await apiGet("/notifications?limit=10");
  if (notif.status !== 200) {
    console.log(`GET /notifications -> HTTP ${notif.status} (needs notification.read — dashboard-only if 403)`);
  } else {
    const list = notif.json.data ?? [];
    if (!list.length) console.log("(no notifications)");
    for (const n of list) {
      console.log(
        `- ${n.id}  ${n.type ?? n.event_type ?? ""}  delivered=${n.delivered_at ?? ""}  status=${n.status_code ?? "?"}`
      );
    }
  }

  // ---------- 4. DB subscription row ----------
  console.log("\n=== 4. DB SUBSCRIPTION ROW (via .env.local DATABASE_URL) ===");
  const fs = require("fs");
  const env = {};
  const envFile = ".env.local";
  if (fs.existsSync(envFile)) {
    for (const l of fs.readFileSync(envFile, "utf8").split("\n")) {
      const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  if (!env.DATABASE_URL) {
    console.log("(no DATABASE_URL in .env.local — cannot query DB locally)");
  } else {
    console.log(`DB host: ${(env.DATABASE_URL.match(/@([^:/]+)/) ?? [])[1] ?? "?"} (pooled)`);
    process.env.DATABASE_URL = env.DATABASE_URL;
    process.env.DIRECT_URL = env.DIRECT_URL || env.DATABASE_URL;
    try {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      const rows = await prisma.subscription.findMany({
        orderBy: { updatedAt: "desc" },
        take: 10,
      });
      if (!rows.length) {
        console.log("(no subscription rows in this DB)");
      }
      for (const r of rows) {
        const user = await prisma.user
          .findUnique({ where: { id: r.userId }, select: { email: true } })
          .catch(() => null);
        const unlocks = ["active", "trialing", "past_due"].includes(r.status);
        console.log(
          `- userId=${r.userId.slice(0, 8)}… email=${maskEmail(user?.email)}  plan=${r.plan}  status=${r.status}  ` +
          `providerSub=${r.providerSubscriptionId ?? "-"}  ` +
          `UNLOCKS PAID ACCESS: ${unlocks ? "YES ✓" : "no"}`
        );
      }
      await prisma.$disconnect();
    } catch (err) {
      console.log(`DB query failed: ${err.message}`);
    }
  }
})();
