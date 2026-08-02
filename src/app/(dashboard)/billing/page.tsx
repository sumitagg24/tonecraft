"use client";
import { useState, useEffect } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { PRICING_TIERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
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

  useEffect(() => {
    if (!isSignedIn) return;
    api<UsageData>("/api/usage")
      .then((data) => {
        setUsageData(data);
        setUsageLoading(false);
      })
      .catch(() => {
        setUsageLoading(false);
        toast.error("Failed to load usage data");
      });
  }, [isSignedIn]);

  const handleSubscribe = async (planName: string) => {
    if (!isSignedIn) return;
    setLoading(planName);
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName }),
      });
      window.location.assign(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const { url } = await api<{ url: string }>("/api/billing/portal", { method: "POST" });
      window.location.assign(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Portal failed");
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = usageData?.plan ?? "free";

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
                       disabled={loading !== null}
                       onClick={() => handleSubscribe(tier.name)}
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
               <Button
                 className="w-full"
                 onClick={handlePortal}
                 disabled={loading !== null}
                >
                  {loading === "portal" ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Opening portal...</>
                  ) : (
                    "Manage Billing"
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
