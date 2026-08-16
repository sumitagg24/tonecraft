"use client";
import { motion } from "framer-motion";

export default function PrivacyPage() {
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
            Privacy Policy
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
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              ToneCraft (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI communication platform.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong className="text-foreground">Account Data:</strong> Name, email address, and authentication credentials provided during registration.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong className="text-foreground">Usage Data:</strong> Messages sent, tones selected, and platform interactions to improve our AI models.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong className="text-foreground">Technical Data:</strong> IP address, browser type, and device information for security and analytics.</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">How We Use Your Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your data to provide and improve our services, process transactions, send technical notices, and respond to support requests. We do not sell or share your personal data with third parties for marketing purposes.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              All data is encrypted in transit using TLS and at rest using industry-standard encryption. Credentials and secrets are encrypted and never exposed to clients.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please email us at{" "}
              <a href="mailto:support@tonecraft.ai" className="text-primary hover:underline">
                support@tonecraft.ai
              </a>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
