import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-premium",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-premium",
        outline:
          "border border-border/60 bg-transparent hover:bg-surface elevated hover:border-primary/30 shadow-card",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass:
          "bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-white/20 text-white shadow-dock",
        gradient:
          "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white hover:from-violet-500 hover:to-cyan-400 shadow-glow",
        premium:
          "bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 shadow-glow font-semibold",
        cyber:
          "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-medium",
        glowIndigo:
          "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] font-medium",
      },
      size: {
        default: "h-11 px-5 py-2.5 rounded-lg",
        sm: "h-9 rounded-md px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-11 w-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  glowing?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, glowing, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          glowing && "animate-pulse-glow"
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
