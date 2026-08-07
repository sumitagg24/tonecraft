"use client";

import dynamic from "next/dynamic";

const Capabilities = dynamic(() => import("@/components/landing/Capabilities").then((m) => ({ default: m.Capabilities })), { ssr: false });
const AIWorkflowSection = dynamic(() => import("@/components/landing/AIWorkflowSection").then((m) => ({ default: m.AIWorkflowSection })), { ssr: false });
const InteractiveDemo = dynamic(() => import("@/components/landing/InteractiveDemo").then((m) => ({ default: m.InteractiveDemo })), { ssr: false });
const WhyToneCraftComparison = dynamic(() => import("@/components/landing/WhyToneCraftComparison").then((m) => ({ default: m.WhyToneCraftComparison })), { ssr: false });
const Companies = dynamic(() => import("@/components/landing/Companies").then((m) => ({ default: m.Companies })), { ssr: false });
const Testimonials = dynamic(() => import("@/components/landing/Testimonials").then((m) => ({ default: m.Testimonials })), { ssr: false });
const Pricing = dynamic(() => import("@/components/landing/Pricing").then((m) => ({ default: m.Pricing })), { ssr: false });
const Roadmap = dynamic(() => import("@/components/landing/RoadmapSection").then((m) => ({ default: m.RoadmapSection })), { ssr: false });
const FAQ = dynamic(() => import("@/components/landing/FAQ").then((m) => ({ default: m.FAQ })), { ssr: false });
const CTA = dynamic(() => import("@/components/landing/CTA").then((m) => ({ default: m.CTA })), { ssr: false });
const Footer = dynamic(() => import("@/components/landing/Footer").then((m) => ({ default: m.Footer })), { ssr: false });

export function DynamicLandingSections() {
  return (
    <>
      <Capabilities />
      <AIWorkflowSection />
      <InteractiveDemo />
      <WhyToneCraftComparison />
      <Companies />
      <Testimonials />
      <Pricing />
      <Roadmap />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}
