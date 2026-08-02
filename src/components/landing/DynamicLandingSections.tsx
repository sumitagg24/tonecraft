"use client";

import dynamic from "next/dynamic";

const InteractiveDemo = dynamic(() => import("@/components/landing/InteractiveDemo").then((m) => ({ default: m.InteractiveDemo })), { ssr: false });
const WhyToneCraftComparison = dynamic(() => import("@/components/landing/WhyToneCraftComparison").then((m) => ({ default: m.WhyToneCraftComparison })), { ssr: false });
const Capabilities = dynamic(() => import("@/components/landing/Capabilities").then((m) => ({ default: m.Capabilities })), { ssr: false });
const AIWorkflowSection = dynamic(() => import("@/components/landing/AIWorkflowSection").then((m) => ({ default: m.AIWorkflowSection })), { ssr: false });
const Testimonials = dynamic(() => import("@/components/landing/Testimonials").then((m) => ({ default: m.Testimonials })), { ssr: false });
const Pricing = dynamic(() => import("@/components/landing/Pricing").then((m) => ({ default: m.Pricing })), { ssr: false });
const FAQ = dynamic(() => import("@/components/landing/FAQ").then((m) => ({ default: m.FAQ })), { ssr: false });
const CTA = dynamic(() => import("@/components/landing/CTA").then((m) => ({ default: m.CTA })), { ssr: false });
const Footer = dynamic(() => import("@/components/landing/Footer").then((m) => ({ default: m.Footer })), { ssr: false });
const BackToTop = dynamic(() => import("@/components/landing/BackToTop").then((m) => ({ default: m.BackToTop })), { ssr: false });

export function DynamicLandingSections() {
  return (
    <>
      <InteractiveDemo />
      <WhyToneCraftComparison />
      <Capabilities />
      <AIWorkflowSection />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
      <BackToTop />
    </>
  );
}
