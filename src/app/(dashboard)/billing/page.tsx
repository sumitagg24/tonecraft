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
} from "lucide-react";
import { PRICING_TIERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/currency";
// Dodo Payments: checkout URL is returned from /api/billing/checkout
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import type { InvoiceItem } from "@/app/api/billing/invoices/route";
import type { PaymentHistoryItem } from "@/app/api/billing/history/route";

interface UsageData {
  plan: string;
  role: string;
  credits: {
    monthly: {
      allocated: number | null;
      used: number;
      remaining: number | null;
      unlimited: boolean;
    };
    daily: {
      allocated: number | null;
      used: number;
      remaining: number | null;
      unlimited: boolean;
    };
  };
  resetDate: string;
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


  // Auto-start checkout when arriving from the landing pricing page (?plan=pro).
  // This is what "Upgrade to Pro → payments page" resolves to: the billing page
  const planParam = searchParams.get("plan");
  // Billing interval: ?interval=year arrives from the landing page's Annual
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

  useEffect(() => {
    if (!isSignedIn) return;
    api<{ customerId: string }>("/api/billing/customer")
      .catch(() => {}); // no customer yet — fine, pwCustomer is optional
  }, [isSignedIn]);

  useEffect(() => {
    if (isSignedIn) {
      fetchUsage();
      fetchInvoices();
      fetchHistory();
    }
  }, [isSignedIn, fetchUsage, fetchInvoices, fetchHistory]);

  // Upgrade / Subscribe Flow — every paid plan (Pro and Enterprise) opens
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
      // Redirect to Dodo Payments hosted checkout
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
    if (!isSignedIn || !planParam || (planParam !== "pro" && planParam !== "enterprise" && planParam !== "basic") || autoTriggered.current) return;
    const current = usagePlanRef.current?.toLowerCase();
    if (!current) return; // wait for the current plan to load first (ref is null/undefined before /api/usage resolves)
    autoTriggered.current = true;
    // Users already on a paid plan should go to the portal, not a duplicate checkout.
    if (current === "pro" || current === "enterprise" || current === "basic") {
      return;
    }
    handleSubscribe(planParam === "enterprise" ? "Advanced" : planParam === "basic" ? "Basic" : "Pro", intervalParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, planParam, intervalParam]);

  const currentPlan = usageData?.plan?.toLowerCase() ?? "free";
  const isPaid = currentPlan === "pro" || currentPlan === "enterprise" || currentPlan === "basic";

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

        {/* Pricing Tiers Cards (4-column grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_TIERS.map((tier) => {
            const isCurrentPlan =
              (tier.name === "Free" && currentPlan === "free") ||
              (tier.name === "Basic" && currentPlan === "basic") ||
              (tier.name === "Pro" && currentPlan === "pro") ||
              (tier.name === "Advanced" && currentPlan === "enterprise");

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
                    {usageData.credits.monthly.used} / {usageData.credits.monthly.unlimited ? "∞" : usageData.credits.monthly.allocated ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Credits Used</p>
                </div>
                <div className="p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
                  <p className="text-2xl font-bold">
                    {usageData.credits.monthly.unlimited ? "∞" : usageData.credits.monthly.remaining ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Credits Remaining</p>
                </div>
                <div className="p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
                  <p className="text-2xl font-bold">
                    {usageData.credits.daily.used} / {usageData.credits.daily.unlimited ? "∞" : usageData.credits.daily.allocated ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Daily Usage</p>
                </div>
                <div className="p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
                  <p className="text-2xl font-bold capitalize">{usageData.plan}</p>
                  <p className="text-xs text-muted-foreground mt-1">Current Plan</p>
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
                        <td className="py-3 px-3 font-medium">{inv.invoiceNumber}</td>
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

        {/* Manage Subscription Card (paid users) */}
        {isPaid && (
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
