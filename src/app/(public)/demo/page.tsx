import type { Metadata } from "next";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Live AI Writing Demo — ToneCraft",
  description:
    "Try ToneCraft's interactive demo: type a message, pick a tone, and watch it transform for every platform in real time.",
  path: "/demo",
});

export default function DemoPage() {
  return (
    <main id="main-content" className="relative noise-bg min-h-screen">
      <h1 className="sr-only">ToneCraft Live Demo</h1>
      <div className="pt-24 md:pt-28">
        <InteractiveDemo />
      </div>
    </main>
  );
}
