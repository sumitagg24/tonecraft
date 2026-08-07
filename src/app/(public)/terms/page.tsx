"use client";
import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <div className="relative noise-bg min-h-screen">
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
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: July 22, 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8"
        >
          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using ToneCraft, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              ToneCraft provides an AI-powered communication platform that rewrites and transforms messages across different tones and platforms. We reserve the right to modify, suspend, or discontinue the service at any time.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">User Responsibilities</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Provide accurate and complete registration information.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Maintain the security of your account and password.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Not use the service for any unlawful or prohibited purpose.</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Subscriptions and Payments</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pro and Enterprise subscriptions are billed monthly or annually. You may cancel your subscription at any time from your billing settings. No refunds are provided for partial billing periods.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              ToneCraft is provided &quot;as is&quot; without warranties of any kind. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please email us at{" "}
              <a href="mailto:support@tonecraft.ai" className="text-primary hover:underline">
                support@tonecraft.ai
              </a>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
