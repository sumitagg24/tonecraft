import { AIOrb } from "@/components/ui/effects/PremiumLoading";
import ShimmerText from "@/components/ui/effects/ShimmerText";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <AIOrb size="lg" className="mb-4" />
      <ShimmerText text="ToneCraft" className="text-4xl" />
    </div>
  );
}
