"use client";
import { motion } from "framer-motion";

export default function RefundsPage() {
  return (
    <main id="main-content" className="relative noise-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            Legal
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: August 24, 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8"
        >
          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Refund Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              We offer refunds within <strong className="text-foreground">14 days</strong> of your initial
              purchase, provided you have not materially used the paid features
              during that period. &quot;Material use&quot; means generating more than
              10 AI outputs on a paid plan.
            </p>
            <ul className="space-y-3 text-muted-foreground mt-4">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Refunds apply to the most recent charge only.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Annual subscriptions may be refunded within 14 days of the annual renewal date.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Refunds are processed to the original payment method within 5–10 business days.</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">How to Request a Refund</h2>
            <p className="text-muted-foreground leading-relaxed">
              To request a refund, email us at{" "}
              <a
                href="mailto:support@tonecraft.site"
                className="text-primary hover:underline"
              >
                support@tonecraft.site
              </a>{" "}
              with your account email and the reason for your request. We aim to
              respond within 2 business days.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Cancellation Process</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may cancel your subscription at any time from your{" "}
              <a href="/billing" className="text-primary hover:underline">
                Billing Settings
              </a>
              . Cancellation takes effect at the end of your current billing
              period — you retain access to paid features until then.
            </p>
            <ul className="space-y-3 text-muted-foreground mt-4">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>
                  <strong className="text-foreground">Monthly plans:</strong> Cancel anytime; access
                  continues until the end of the current month.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>
                  <strong className="text-foreground">Annual plans:</strong> Cancel anytime; access
                  continues until the end of the paid year.
                </span>
              </li>
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Proration Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you upgrade or downgrade your plan mid-cycle, Dodo Payments calculates
              a prorated credit for the unused portion of your current plan and
              applies it to the new plan. No full-price refund is issued for
              downgrades — the adjustment appears on your next invoice.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Exceptions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Refunds may be denied if:
            </p>
            <ul className="space-y-3 text-muted-foreground mt-4">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>The 14-day window has passed.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>You have materially used the paid features.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>The refund request is for a prior billing period.</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about refunds or cancellations, please email us at{" "}
              <a
                href="mailto:support@tonecraft.site"
                className="text-primary hover:underline"
              >
                support@tonecraft.site
              </a>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
