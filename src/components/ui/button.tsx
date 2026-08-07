import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985]",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:bg-foreground/90 shadow-editorial",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-editorial",
        outline:
          "border border-border/60 bg-background hover:bg-muted/40 text-foreground shadow-card",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted/50 hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        glass:
          "bg-background/60 border border-border/40 backdrop-blur-md hover:bg-background/80 text-foreground shadow-editorial",
        gradient:
          "bg-foreground text-background hover:bg-foreground/90 shadow-editorial font-medium",
        premium:
          "bg-foreground text-background hover:bg-foreground/90 shadow-editorial-lg font-semibold",
        cyber:
          "bg-muted border border-border text-foreground hover:bg-muted/80 font-medium",
        glowIndigo:
          "bg-foreground text-background hover:bg-foreground/90 shadow-editorial font-medium",
      },
      size: {
        default: "h-11 px-5 py-2.5 rounded-xl",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-13 rounded-2xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10 rounded-xl",
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
