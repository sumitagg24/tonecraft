import { ok, withApiHandler } from "@/lib/withApiHandler";
import { billingService } from "@/billing/BillingService";
import { logger } from "@/lib/logger";
import { getPriceId, PLAN_PRICE_MAP } from "@/lib/billing-prices";

const api = withApiHandler();

/**
 * GET /api/billing/health
 * One-click diagnostic for the Paddle setup: env vars present, API key
 * connectivity, and whether the configured price IDs exist in the account.
 */
export const GET = api.GET(async () => {
  const environment =
    process.env.NODE_ENV === "production" ? "production" : "sandbox";

  const envChecks = [
    {
      key: "PADDLE_API_KEY",
      ok: Boolean(process.env.PADDLE_API_KEY),
      description: "Authenticates requests to the Paddle Billing API.",
      hint: "Paddle dashboard → Developer tools → Authentication",
    },
    {
      key: "PADDLE_PRICE_PRO",
      ok: Boolean(process.env.PADDLE_PRICE_PRO),
      description: "The price ID Paddle charges for the Pro plan.",
      hint: "Catalog → Products → Prices (id starts with pri_)",
    },
    {
      key: "PADDLE_PRICE_ENTERPRISE",
      ok: Boolean(process.env.PADDLE_PRICE_ENTERPRISE),
      description: "The price ID Paddle charges for the Enterprise plan.",
      hint: "Catalog → Products → Prices (id starts with pri_)",
    },
    {
      key: "PADDLE_PRICE_PRO_ANNUAL",
      ok: Boolean(process.env.PADDLE_PRICE_PRO_ANNUAL),
      description: "The price ID for the Pro annual plan (used by the Annual toggle — 20% off).",
      hint: "Catalog → Products → Pro → create a yearly price, then set this env var",
    },
    {
      key: "PADDLE_PRICE_ENTERPRISE_ANNUAL",
      ok: Boolean(process.env.PADDLE_PRICE_ENTERPRISE_ANNUAL),
      description: "The price ID for the Enterprise annual plan (used by the Annual toggle — 20% off).",
      hint: "Catalog → Products → Enterprise → create a yearly price, then set this env var",
    },
    {
      key: "PADDLE_WEBHOOK_SECRET",
      ok: Boolean(process.env.PADDLE_WEBHOOK_SECRET),
      description: "Verifies webhook events so subscriptions sync automatically.",
      hint: "Developer tools → Notifications → destination secret (pdl_ntfset_)",
    },
  ];

  const proPriceId = PLAN_PRICE_MAP.Pro;
  const entPriceId = PLAN_PRICE_MAP.Enterprise;

  let paddle: { ok: boolean; error?: string; productCount?: number; description?: string } = {
    ok: false,
    error: "Not checked",
  };
  let prices: {
    priceId: string;
    label: string;
    envKey?: string;
    found: boolean;
    name?: string;
    description?: string;
  }[] = [];

  try {
    const products = await billingService.listProducts();
    paddle = {
      ok: true,
      productCount: products.length,
      description: "Reaches the Paddle Billing API and lists your active products — confirms the key belongs to this environment.",
    };
  } catch (err) {
    logger.error("Billing health: Paddle API unreachable", { error: String(err) });
    paddle = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  if (paddle.ok) {
    try {
      const all = await billingService.listPrices();
      const priceMap = new Map(all.map((p) => [p.id, p]));
      const priceConfigs = [
        {
          priceId: proPriceId,
          label: "Pro (monthly)",
          envKey: "PRO",
          description: "The price that appears in the Pro monthly checkout — must exist in this account.",
        },
        {
          priceId: entPriceId,
          label: "Enterprise (monthly)",
          envKey: "ENTERPRISE",
          description: "The price that appears in the Enterprise monthly checkout — must exist in this account.",
        },
      ];
      // Annual prices are optional — only checked when configured via env.
      const proAnnual = getPriceId("Pro", "year");
      if (proAnnual) {
        priceConfigs.push({
          priceId: proAnnual,
          label: "Pro (annual)",
          envKey: "PRO_ANNUAL",
          description: "The price that appears in the Pro annual checkout (Annual toggle — 20% off).",
        });
      }
      const entAnnual = getPriceId("Enterprise", "year");
      if (entAnnual) {
        priceConfigs.push({
          priceId: entAnnual,
          label: "Enterprise (annual)",
          envKey: "ENTERPRISE_ANNUAL",
          description: "The price that appears in the Enterprise annual checkout (Annual toggle — 20% off).",
        });
      }
      prices = priceConfigs.map((c) => ({
        priceId: c.priceId,
        label: c.label,
        envKey: c.envKey,
        found: priceMap.has(c.priceId),
        name: priceMap.get(c.priceId)?.name ?? undefined,
        description: c.description,
      }));
    } catch (err) {
      logger.error("Billing health: price listing failed", { error: String(err) });
      prices = [
        { priceId: proPriceId, label: "Pro (monthly)", envKey: "PRO", found: false },
        { priceId: entPriceId, label: "Enterprise (monthly)", envKey: "ENTERPRISE", found: false },
      ];
    }
  }

  const allEnvOk = envChecks.every((c) => c.ok);
  const allPricesFound = prices.length > 0 && prices.every((p) => p.found);
  const overall =
    allEnvOk && paddle.ok && allPricesFound ? "ok" : "action_required";

  return ok({
    provider: billingService.getProviderName(),
    environment,
    overall,
    env: envChecks,
    paddle,
    prices,
  });
});
