import { ok, withApiHandler } from "@/lib/withApiHandler";
import { billingService } from "@/billing/BillingService";
import { logger } from "@/lib/logger";

const api = withApiHandler();

/**
 * GET /api/billing/health
 * One-click diagnostic for the Dodo Payments setup: env vars present, API key
 * connectivity, and whether the configured price IDs exist in the account.
 */
export const GET = api.GET(async () => {
  const environment =
    process.env.NODE_ENV === "production" ? "production" : "sandbox";

  const envChecks = [
    {
      key: "DODO_PAYMENTS_API_KEY",
      ok: Boolean(process.env.DODO_PAYMENTS_API_KEY),
      description: "Authenticates requests to the Dodo Payments API.",
      hint: "Dodo dashboard → Developer → API Keys",
    },
    {
      key: "DODO_PRODUCT_PRO",
      ok: Boolean(process.env.DODO_PRODUCT_PRO),
      description: "The product ID for the Pro plan.",
      hint: "Catalog → Products → Prices (id starts with pri_)",
    },
    {
      key: "DODO_PRODUCT_ADVANCED",
      ok: Boolean(process.env.DODO_PRODUCT_ADVANCED),
      description: "The product ID for the Advanced plan.",
      hint: "Catalog → Products → Prices (id starts with pri_)",
    },
    {
      key: "DODO_PAYMENTS_WEBHOOK_KEY",
      ok: Boolean(process.env.DODO_PAYMENTS_WEBHOOK_KEY),
      description: "Verifies incoming webhook signatures.",
      hint: "Dodo dashboard → Developer → Webhooks",
    },
  ];

  const proPriceId = process.env.DODO_PRODUCT_PRO || "";
  const entPriceId = process.env.DODO_PRODUCT_ADVANCED || "";

  let dodo: { ok: boolean; error?: string; productCount?: number; description?: string } = {
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
    dodo = {
      ok: true,
      productCount: products.length,
      description: "Reaches the Dodo Payments API and lists your active products — confirms the key belongs to this environment.",
    };
  } catch (err) {
    logger.error("Billing health: Dodo API unreachable", { error: String(err) });
    dodo = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  if (dodo.ok) {
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
      const proAnnual = process.env.DODO_PRODUCT_PRO || "";
      if (proAnnual) {
        priceConfigs.push({
          priceId: proAnnual,
          label: "Pro (annual)",
          envKey: "PRO_ANNUAL",
          description: "The price that appears in the Pro annual checkout (Annual toggle — 20% off).",
        });
      }
      const entAnnual = process.env.DODO_PRODUCT_ADVANCED || "";
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
    allEnvOk && dodo.ok && allPricesFound ? "ok" : "action_required";

  return ok({
    provider: billingService.getProviderName(),
    environment,
    overall,
    env: envChecks,
    dodo,
    prices,
  });
});
