import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { DynamicLandingSections } from "@/components/landing/DynamicLandingSections";

export default function HomePage() {
  return (
    <div className="relative noise-bg">
      <Navbar />
      <main id="main-content">
        <Hero />
        <DynamicLandingSections />
      </main>
    </div>
  );
}
