"use client";
import { useState, useEffect } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { PRICING_TIERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription activated! Welcome to Pro.");
    }
    if (searchParams.get("canceled") === "true") {
      toast.error("Checkout was canceled.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/usage")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load usage");
        return res.json();
      })
      .then((data: UsageData) => {
        setUsageData(data);
        setUsageLoading(false);
      })
      .catch(() => {
        setUsageLoading(false);
        toast.error("Failed to load usage data");
      });
  }, [isSignedIn]);

  const handleSubscribe = async (priceId: string) => {
    if (!isSignedIn) return;
    setLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Checkout failed");
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = usageData?.plan ?? "free";

  const getPriceId = (tierName: string) => {
    if (tierName === "Pro") return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;
    if (tierName === "Enterprise") return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE;
    return null;
  };

  const isPro = currentPlan === "pro" || currentPlan === "enterprise";

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Pricing</h1>
          <p className="text-muted-foreground">
            Choose the plan that fits your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => {
            const priceId = getPriceId(tier.name);
            const isCurrentPlan =
              (tier.name === "Free" && currentPlan === "free") ||
              (tier.name === "Pro" && currentPlan === "pro") ||
              (tier.name === "Enterprise" && currentPlan === "enterprise");

            return (
              <Card
                key={tier.name}
                className={cn(
                  "relative",
                  tier.popular && "border-primary shadow-lg shadow-primary/10"
                )}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {tier.name}
                    {isCurrentPlan && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    {tier.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
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
                      className="w-full"
                      variant={tier.popular ? "default" : "outline"}
                      disabled={!priceId || loading !== null}
                      onClick={() => priceId && handleSubscribe(priceId)}
                    >
                      {loading === tier.name ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />Redirecting...</>
                      ) : (
                        tier.cta
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Current Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>
              Plan: <span className="font-medium capitalize">{currentPlan}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : usageData ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border">
                  <p className="text-2xl font-bold">
                    {usageData.usage.messagesSent} /{" "}
                    {usageData.limits.messagesPerDay === Infinity
                      ? "∞"
                      : usageData.limits.messagesPerDay}
                  </p>
                  <p className="text-xs text-muted-foreground">Messages Sent</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-2xl font-bold">
                    {usageData.usage.tokensUsed.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Tokens Used</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-2xl font-bold">{usageData.usage.filesUploaded}</p>
                  <p className="text-xs text-muted-foreground">Files Uploaded</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-2xl font-bold">
                    {(usageData.usage.storageUsed / 1024 / 1024).toFixed(1)} MB
                  </p>
                  <p className="text-xs text-muted-foreground">Storage Used</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Failed to load usage data.</p>
            )}
          </CardContent>
        </Card>

        {/* Manage Subscription (Pro users) */}
        {isPro && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscription</CardTitle>
              <CardDescription>View or change your subscription settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full gap-2" asChild>
                <a href="https://billing.stripe.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Manage Subscription
                </a>
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive"
                onClick={async () => {
                  if (!window.confirm("Are you sure you want to cancel your subscription? You will lose Pro access at the end of your billing period.")) return;
                  try {
                    const res = await fetch("/api/stripe/cancel", { method: "POST" });
                    if (!res.ok) throw new Error("Failed to cancel");
                    toast.success("Subscription canceled");
                    window.location.reload();
                  } catch {
                    toast.error("Failed to cancel subscription");
                  }
                }}
              >
                <AlertCircle className="w-4 h-4" />
                Cancel Subscription
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
          <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
