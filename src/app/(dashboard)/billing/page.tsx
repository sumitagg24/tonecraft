"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Loader2,
  Download,
  FileText,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { PRICING_TIERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/currency";
import { openPaddleCheckout } from "@/lib/paddle-client";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import type { InvoiceItem } from "@/app/api/billing/invoices/route";
import type { PaymentHistoryItem } from "@/app/api/billing/history/route";

interface BillingHealth {
  provider: string;
  environment: string;
  overall: "ok" | "action_required";
  env: { key: string; ok: boolean; hint?: string; description?: string }[];
  paddle: { ok: boolean; error?: string; productCount?: number; description?: string };
  prices: { priceId: string; label: string; envKey?: string; found: boolean; name?: string; description?: string }[];
}

interface UsageData {
  usage: {
    messagesSent: number;
    tokensUsed: number;
    filesUploaded: number;
    storageUsed: number;
  };
  plan: string;
  limits: {
    messagesPerDay: number;
    messagesPerHour: number;
  };
}

function BillingContent() {
  const { isSignedIn } = useUser();
  const searchParams = useSearchParams();

  // Action loading state (plan name or 'portal')
  const [loading, setLoading] = useState<string | null>(null);

  // Usage Data state
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState(false);

  // Invoices state
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState(false);

  // Payment History state
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);

  // Billing setup diagnostics
  const [health, setHealth] = useState<BillingHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Live checkout probe (verifies the full Paddle payment path end-to-end)
  const [checkoutTest, setCheckoutTest] = useState<{ ok: boolean; message: string; url?: string } | null>(null);
  const [checkoutTesting, setCheckoutTesting] = useState(false);

  // Auto-start checkout when arriving from the landing pricing page (?plan=pro).
  // This is what "Upgrade to Pro → payments page" resolves to: the billing page
  // immediately opens Paddle's secure checkout.
  const planParam = searchParams.get("plan");
  // Billing interval: ?interval=year arrives from the landing page's Annual
  // toggle and selects the annual (20% off) Paddle price in the checkout.
  const intervalParam = searchParams.get("interval") === "year" ? "year" : "month";
  // Local toggle state — synced from the URL after mount to avoid a
  // server/client hydration mismatch on the toggle UI.
  const [interval, setBillingInterval] = useState<"month" | "year">("month");
  useEffect(() => {
    setBillingInterval(intervalParam);
  }, [intervalParam]);

  const autoTriggered = useRef(false);
  // Ref mirror of the loaded plan so the effect below can read it without
  // changing the dependency array shape between renders (avoids the React
  // "final argument to useEffect changed size" warning).
  const usagePlanRef = useRef<string | null>(null);

  // Handle URL Feedback (Toast)
  useEffect(() => {
    const success =
      searchParams.get("success") === "true" ||
      searchParams.get("checkout") === "completed";
    const canceled =
      searchParams.get("canceled") === "true" ||
      searchParams.get("checkout") === "canceled";

    if (success) {
      toast.success("Subscription activated! Welcome to Pro.");
    }
    if (canceled) {
      toast.error("Checkout was canceled.");
    }
  }, [searchParams]);

  // Fetch Usage
  const fetchUsage = useCallback(async () => {
    if (!isSignedIn) return;
    setUsageLoading(true);
    setUsageError(false);
    try {
      const data = await api<UsageData>("/api/usage");
      setUsageData(data);
      usagePlanRef.current = data?.plan ?? null;
    } catch {
      setUsageError(true);
      toast.error("Failed to load usage data.");
    } finally {
      setUsageLoading(false);
    }
  }, [isSignedIn]);

  // Fetch Invoices
  const fetchInvoices = useCallback(async () => {
    if (!isSignedIn) return;
    setInvoicesLoading(true);
    setInvoicesError(false);
    try {
      const res = await api<{ invoices: InvoiceItem[] }>("/api/billing/invoices");
      setInvoices(res.invoices ?? []);
    } catch {
      setInvoicesError(true);
    } finally {
      setInvoicesLoading(false);
    }
  }, [isSignedIn]);

  // Fetch Payment History
  const fetchHistory = useCallback(async () => {
    if (!isSignedIn) return;
    setHistoryLoading(true);
    setHistoryError(false);
    try {
      const res = await api<{ history: PaymentHistoryItem[] }>("/api/billing/history");
      setHistory(res.history ?? []);
    } catch {
      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  }, [isSignedIn]);

  // Fetch billing setup diagnostics
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      setHealth(await api<BillingHealth>("/api/billing/health"));
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetchUsage();
      fetchInvoices();
      fetchHistory();
      fetchHealth();
    }
  }, [isSignedIn, fetchUsage, fetchInvoices, fetchHistory, fetchHealth]);

  // Upgrade / Subscribe Flow — every paid plan (Pro and Enterprise) opens
  // Paddle's secure hosted checkout. `billingInterval` picks the monthly or
  // annual (20% off) Paddle price. Checkout always uses the USD price.
  const handleSubscribe = async (
    planName: string,
    billingInterval: "month" | "year" = "month"
  ) => {
    if (!isSignedIn) return;

    setLoading(planName);
    try {
      const { url, transactionId } = await api<{ url: string; transactionId?: string | null }>(
        "/api/billing/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: planName,
            interval: billingInterval,
            currency: "USD",
          }),
        }
      );
      // Preferred: open the Paddle.js hosted checkout overlay in-place.
      if (transactionId) {
        try {
          await openPaddleCheckout(transactionId, {
            onSuccess: () => {
              toast.success("Subscription activated!");
              fetchUsage();
              fetchInvoices();
              fetchHistory();
            },
          });
          setLoading(null);
          return;
        } catch {
          // Paddle.js failed to load — fall back to navigating to the URL.
        }
      }
      window.location.assign(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
      setLoading(null);
    }
  };

  // Customer Portal Flow
  const handlePortal = async () => {
    setLoading("portal");
    try {
      const { url } = await api<{ url: string }>("/api/billing/portal", {
        method: "POST",
      });
      window.location.assign(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open portal");
      setLoading(null);
    }
  };

  useEffect(() => {
    if (!isSignedIn || !planParam || (planParam !== "pro" && planParam !== "enterprise") || autoTriggered.current) return;
    const current = usagePlanRef.current?.toLowerCase();
    if (!current) return; // wait for the current plan to load first (ref is null/undefined before /api/usage resolves)
    autoTriggered.current = true;
    // Users already on a paid plan should go to the portal, not a duplicate checkout.
    if (current === "pro" || current === "enterprise") {
      return;
    }
    handleSubscribe(planParam === "enterprise" ? "Enterprise" : "Pro", intervalParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, planParam, intervalParam]);

  // Live end-to-end checkout probe — creates a real (unpaid) Paddle checkout
  // for the Pro plan so the health card can confirm the full path works and
  // surface the provider's exact error (e.g. missing default payment link).
  const testCheckout = async () => {
    if (!isSignedIn) return;
    setCheckoutTesting(true);
    setCheckoutTest(null);
    try {
      const { url, transactionId } = await api<{ url: string; transactionId?: string | null }>(
        "/api/billing/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: "Pro",
            interval: "month",
            currency: "USD",
          }),
        }
      );
      if (transactionId) {
        try {
          await openPaddleCheckout(transactionId, {
            onSuccess: () =>
              setCheckoutTest({
                ok: true,
                message: "Checkout works — sandbox payment completed.",
                url,
              }),
          });
          setCheckoutTest({
            ok: true,
            message: "Checkout works — the Paddle payment overlay is open for the Pro plan.",
            url,
          });
        } catch {
          setCheckoutTest({
            ok: true,
            message: "Checkout works — a secure Paddle payment page was created for the Pro plan.",
            url,
          });
        }
      } else {
        setCheckoutTest({
          ok: true,
          message: "Checkout works — a secure Paddle payment page was created for the Pro plan.",
          url,
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Checkout creation failed.";
      setCheckoutTest({ ok: false, message });
    } finally {
      setCheckoutTesting(false);
    }
  };

  const currentPlan = usageData?.plan?.toLowerCase() ?? "free";
  const isPro = currentPlan === "pro" || currentPlan === "enterprise";

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pricing</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Choose the plan that fits your needs.
            </p>
          </div>

          {/* Billing interval toggle (mirrors the landing page) */}
          <div className="inline-flex items-center p-1 rounded-xl bg-muted/40 border border-border/50">
            <button
              onClick={() => setBillingInterval("month")}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
                interval === "month"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("year")}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
                interval === "year"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annual (20% off)
            </button>
          </div>
        </div>

        {/* Pricing Tiers Cards (3-column grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => {
            const isCurrentPlan =
              (tier.name === "Free" && currentPlan === "free") ||
              (tier.name === "Pro" && currentPlan === "pro") ||
              (tier.name === "Enterprise" && currentPlan === "enterprise");

            return (
              <Card
                key={tier.name}
                className={cn(
                  "relative flex flex-col justify-between transition-all duration-300",
                  tier.popular && "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20",
                  isCurrentPlan && "border-emerald-500/50 bg-emerald-500/5"
                )}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-brand-foreground border-none shadow-sm px-3 py-0.5 text-xs font-semibold">
                    <Zap className="w-3 h-3 mr-1 inline" /> Most Popular
                  </Badge>
                )}
                <div>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="font-bold">{tier.name}</span>
                      {isCurrentPlan && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium">
                          Current Plan
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="pt-4 flex items-baseline gap-1">
                      <span className="text-3xl md:text-4xl font-bold">
                        {formatMoney(interval === "year" ? Math.floor(tier.price * 0.8) : tier.price)}
                      </span>
                      <span className="text-muted-foreground text-sm">/month</span>
                    </div>
                    {interval === "year" && tier.price > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Billed {formatMoney(Math.floor(tier.price * 0.8) * 12)}/year — save 20%
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-t border-border/40 pt-4">
                      <ul className="space-y-2.5">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground/90">
                            <Check className="w-4 h-4 text-primary shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </div>

                <div className="p-6 pt-0 mt-4">
                  {tier.price === 0 ? (
                    <Button className="w-full" variant="outline" disabled>
                      {isCurrentPlan ? "Current Plan" : "Free Forever"}
                    </Button>
                  ) : isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full font-medium transition-all duration-200",
                        tier.popular ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" : "border-border/60"
                      )}
                      variant={tier.popular ? "default" : "outline"}
                      disabled={loading !== null}
                      onClick={() => handleSubscribe(tier.name, interval)}
                    >
                      {loading === tier.name ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Redirecting...
                        </>
                      ) : (
                        <><Zap className="w-4 h-4 mr-2" /> {tier.cta}</>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Billing Setup Diagnostics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Billing Setup
              </CardTitle>
              <CardDescription>
                One-click diagnostic of your payment provider configuration.
              </CardDescription>
            </div>
            {!healthLoading && health && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs font-medium",
                  health.overall === "ok"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                )}
              >
                {health.overall === "ok" ? "All systems ready" : "Action required"}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-muted/50 rounded-lg" />
                ))}
              </div>
            ) : health ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Provider</span>
                  <Badge variant="outline" className="text-nano font-mono">{health.provider}</Badge>
                  <span>Environment</span>
                  <Badge variant="outline" className="text-nano font-mono">{health.environment}</Badge>
                  <span>Your API key and prices must belong to the same environment — sandbox keys only work with sandbox prices.</span>
                </div>

                {/* ── Plain-language interpretation ───────────────── */}
                {(() => {
                  const passed =
                    health.env.filter((c) => c.ok).length +
                    (health.paddle.ok ? 1 : 0) +
                    health.prices.filter((p) => p.found).length;
                  const total = health.env.length + 1 + health.prices.length;
                  const probeAlreadyPaid = checkoutTest?.message.includes("already active") ?? false;
                  // Distinguish "monthly checkout is live" from "something
                  // fundamental is broken": count failures among the core
                  // (non-annual) checks only.
                  const monthlyFailures =
                    health.env.filter(
                      (c) =>
                        ["PADDLE_API_KEY", "PADDLE_PRICE_PRO", "PADDLE_PRICE_ENTERPRISE", "PADDLE_WEBHOOK_SECRET"].includes(c.key) &&
                        !c.ok
                    ).length +
                    (health.paddle.ok ? 0 : 1) +
                    health.prices.filter((p) => !p.label.includes("annual") && !p.found).length;
                  return (
                    <>
                      <div
                        className={cn(
                          "rounded-xl border p-3.5 text-sm",
                          health.overall === "ok"
                            ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-300"
                        )}
                      >
                        {health.overall === "ok" ? (
                          <>
                            <p className="font-semibold">All systems ready — checkout is live.</p>
                            <p className="text-xs opacity-80 mt-1">
                              {passed} of {total} checks pass. Clicking Upgrade on any plan (Pro or Enterprise) will open
                              Paddle&apos;s secure hosted checkout immediately.
                            </p>
                          </>
                        ) : monthlyFailures === 0 ? (
                          <>
                            <p className="font-semibold">
                              Monthly checkout is live — {passed} of {total} checks pass.
                            </p>
                            <p className="text-xs opacity-80 mt-1">
                              The remaining steps enable the Annual (20% off) toggle: create yearly prices in Catalog →
                              Products and set the PADDLE_PRICE_*_ANNUAL env vars shown below.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold">
                              {passed} of {total} checks pass — complete the highlighted steps below.
                            </p>
                            <p className="text-xs opacity-80 mt-1">
                              Each failed check shows the exact Paddle dashboard path to fix it. When everything passes,
                              this banner turns green and checkout opens normally.
                            </p>
                          </>
                        )}
                      </div>

                      {/* ── Live end-to-end probe ──────────────────── */}
                      <div className="rounded-lg border border-border/30 p-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-xs font-mono font-medium">Live checkout probe</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Creates a real (unpaid) Paddle checkout for the Pro plan to verify the full payment path —
                              this is exactly what happens when a user clicks Upgrade.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={testCheckout}
                            disabled={checkoutTesting || loading !== null || checkoutTest?.ok === true}
                            className="shrink-0"
                          >
                            {checkoutTesting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Testing...
                              </>
                            ) : checkoutTest?.ok ? (
                              "Probe passed"
                            ) : (
                              "Test checkout"
                            )}
                          </Button>
                        </div>
                        {checkoutTest && (
                          <div
                            className={cn(
                              "mt-2.5 rounded-lg border p-2.5 text-xs",
                              probeAlreadyPaid
                                ? "border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300"
                                : checkoutTest.ok
                                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                                  : "border-destructive/30 bg-destructive/5 text-destructive"
                            )}
                          >
                            <p className="font-medium">
                              {probeAlreadyPaid
                                ? "Already on a paid plan"
                                : checkoutTest.ok
                                  ? "Success"
                                  : "Checkout failed"}
                            </p>
                            <p className="mt-0.5 opacity-90">
                              {probeAlreadyPaid
                                ? "You already have an active subscription, so a new checkout isn't needed — this confirms the billing setup is working."
                                : checkoutTest.message}
                            </p>
                            {checkoutTest.url && (
                              <a
                                href={checkoutTest.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
                              >
                                Open the test checkout page
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                <div className="space-y-1.5">
                  {health.env.map((c) => (
                    <div key={c.key} className="flex items-start gap-2.5 rounded-lg border border-border/30 p-2.5">
                      {c.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-medium">{c.key}</p>
                        {c.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                        )}
                        {!c.ok && c.hint && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            Fix: {c.hint}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-border/30 p-2.5">
                  {health.paddle.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-medium">Paddle API connectivity</p>
                    {health.paddle.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{health.paddle.description}</p>
                    )}
                    {health.paddle.ok ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Connected — {health.paddle.productCount ?? 0} active product(s) found
                      </p>
                    ) : (
                      <p className="text-xs text-destructive mt-0.5">{health.paddle.error}</p>
                    )}
                  </div>
                </div>

                {health.prices.map((p) => (
                  <div key={p.priceId} className="flex items-start gap-2.5 rounded-lg border border-border/30 p-2.5">
                    {p.found ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-medium">
                        {p.label} price <span className="text-muted-foreground">({p.priceId})</span>
                      </p>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                      )}
                      {p.found ? (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {p.name ?? "Active price in your account"}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                          Fix: not found in this {health.environment} account — create it under Catalog → Products with a
                          subscription price, then set PADDLE_PRICE_{p.envKey ?? p.label.split(" ")[0].toUpperCase()}.
                        </p>
                      )}
                    </div>
                  </div>
                ))}


              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Unable to reach billing diagnostics. Try again in a moment.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Current Usage Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl">Current Usage</CardTitle>
              <CardDescription>
                Plan: <span className="font-semibold capitalize text-foreground">{currentPlan}</span>
              </CardDescription>
            </div>
            {usageError && (
              <Button size="sm" variant="ghost" onClick={fetchUsage} className="text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-border/50 bg-muted/40 space-y-2">
                    <div className="h-7 w-20 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : usageError ? (
              <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Failed to load usage data. Please click retry.</span>
              </div>
            ) : usageData ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
                  <p className="text-2xl font-bold">
                    {usageData.usage.messagesSent} /{" "}
                    {usageData.limits.messagesPerDay === Infinity || currentPlan === "pro" || currentPlan === "enterprise"
                      ? "∞"
                      : usageData.limits.messagesPerDay}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Messages Sent</p>
                </div>
                <div className="p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
                  <p className="text-2xl font-bold">
                    {usageData.usage.tokensUsed >= 1000
                      ? `${(usageData.usage.tokensUsed / 1000).toFixed(0)}K`
                      : usageData.usage.tokensUsed}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Tokens Used</p>
                </div>
                <div className="p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
                  <p className="text-2xl font-bold">
                    {usageData.usage.filesUploaded} / {isPro ? "∞" : "10"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Files Uploaded</p>
                </div>
                <div className="p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
                  <p className="text-2xl font-bold">
                    {(usageData.usage.storageUsed / 1024 / 1024).toFixed(1)} MB / {isPro ? "5 GB font-normal" : "100 MB"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Storage Used</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No usage statistics available.</p>
            )}
          </CardContent>
        </Card>

        {/* Invoices Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Invoices
              </CardTitle>
              <CardDescription>
                View and download past invoices for your account.
              </CardDescription>
            </div>
            {invoicesError && (
              <Button size="sm" variant="ghost" onClick={fetchInvoices} className="text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 bg-muted/50 rounded-lg" />
                ))}
              </div>
            ) : invoicesError ? (
              <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Failed to load invoices.</span>
              </div>
            ) : invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase border-b border-border/40 bg-muted/20">
                    <tr>
                      <th className="py-2.5 px-3">Invoice Number</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/10">
                        <td className="py-3 px-3 font-medium">{inv.number}</td>
                        <td className="py-3 px-3 text-muted-foreground">{inv.date}</td>
                        <td className="py-3 px-3">{inv.amount}</td>
                        <td className="py-3 px-3">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs capitalize",
                              inv.status === "paid" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                              inv.status === "pending" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            )}
                          >
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => toast.info("Invoice PDF download requested.")}>
                            <Download className="w-3.5 h-3.5 mr-1" /> PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border/60 rounded-xl">
                No invoices found for this account.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Payment History
              </CardTitle>
              <CardDescription>
                Recent billing transactions and payment events.
              </CardDescription>
            </div>
            {historyError && (
              <Button size="sm" variant="ghost" onClick={fetchHistory} className="text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 bg-muted/50 rounded-lg" />
                ))}
              </div>
            ) : historyError ? (
              <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Failed to load payment history.</span>
              </div>
            ) : history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase border-b border-border/40 bg-muted/20">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {history.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/10">
                        <td className="py-3 px-3 text-muted-foreground">{tx.date}</td>
                        <td className="py-3 px-3 font-medium">{tx.description}</td>
                        <td className="py-3 px-3 text-muted-foreground">{tx.paymentMethod}</td>
                        <td className="py-3 px-3">{tx.amount}</td>
                        <td className="py-3 px-3">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs capitalize",
                              tx.status === "succeeded" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                              tx.status === "failed" && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                              tx.status === "pending" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            )}
                          >
                            {tx.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border/60 rounded-xl">
                No payment history available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manage Subscription Card (Pro users) */}
        {isPro && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xl">Manage Subscription</CardTitle>
              <CardDescription>
                Update your payment method, view details, or change subscription preferences in the portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                className="w-full sm:w-auto min-w-[200px]"
                onClick={handlePortal}
                disabled={loading !== null}
              >
                {loading === "portal" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Opening portal...
                  </>
                ) : (
                  "Open Customer Portal"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 overflow-auto p-6">
          <div
            className="max-w-4xl mx-auto flex items-center justify-center h-64"
            role="status"
            aria-label="Loading"
          >
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
