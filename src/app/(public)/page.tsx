import { Hero } from "@/components/landing/Hero";
import { DynamicLandingSections } from "@/components/landing/DynamicLandingSections";

export default function HomePage() {
  return (
    <div className="relative noise-bg">
      <main id="main-content">
        <Hero />
        <DynamicLandingSections />
      </main>
    </div>
  );
}
