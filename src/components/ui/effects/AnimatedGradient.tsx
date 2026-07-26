"use client";
import { cn } from "@/lib/utils";

type GradientVariant = "aurora" | "midnight" | "glass" | "oled" | "noise" | "mesh" | "glow";

interface AnimatedGradientProps {
  variant?: GradientVariant;
  className?: string;
  children?: React.ReactNode;
}

const variantClasses: Record<GradientVariant, string> = {
  aurora: "aurora-bg",
  midnight: "midnight-bg",
  glass: "glass-bg",
  oled: "oled-bg",
  noise: "noise-bg",
  mesh: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent",
  glow: "bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,_hsl(var(--primary)/0.08),_transparent_70%)]",
};

export function AnimatedGradient({ variant = "aurora", className, children }: AnimatedGradientProps) {
  return (
    <div className={cn("relative", variantClasses[variant], className)}>
      {children}
    </div>
  );
}

export function BackgroundEffects({ variant = "noise", className }: { variant?: GradientVariant; className?: string }) {
  return <div className={cn("fixed inset-0 -z-10 pointer-events-none", variantClasses[variant], className)} />;
}
