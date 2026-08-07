"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

/**
 * ToneCraft Brand Logo — Inspired by Craft, Editorial Publishing, Typography, and Writing.
 * Represents an elegant nib / stylus forming a dynamic craft curve / letterform.
 * Completely free of robots, sparkles, brains, or generic AI icons.
 */
export function Logo({ className, iconOnly = false, size = "md", animated = false }: LogoProps) {
  const sizeMap = {
    sm: { icon: "w-5 h-5", text: "text-lg", gap: "gap-2" },
    md: { icon: "w-7 h-7", text: "text-xl", gap: "gap-2.5" },
    lg: { icon: "w-9 h-9", text: "text-2xl", gap: "gap-3" },
    xl: { icon: "w-12 h-12", text: "text-3xl", gap: "gap-3.5" },
  };

  const dim = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center select-none group cursor-pointer", dim.gap, className)}>
      <div className={cn("relative shrink-0 flex items-center justify-center text-foreground", dim.icon)}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn("w-full h-full transition-transform duration-300 group-hover:scale-105", animated && "animate-pulse-soft")}
        >
          {/* Base Craft / Nib Geometry */}
          <path
            d="M24 4L38 18L24 44L10 18L24 4Z"
            className="stroke-foreground fill-foreground/5 dark:fill-foreground/10 transition-colors"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Inner Quill/Nib slit cut */}
          <path
            d="M24 4V24"
            className="stroke-foreground"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Ink / Breather hole */}
          <circle
            cx="24"
            cy="24"
            r="2.5"
            className="fill-foreground"
          />
          {/* Flow Arc representing Tone & Voice transformation */}
          <path
            d="M14 26C14 26 18 31 24 31C30 31 34 26 34 26"
            className="stroke-foreground/60"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!iconOnly && (
        <span className={cn("font-display font-medium tracking-tight text-foreground", dim.text)}>
          ToneCraft
        </span>
      )}
    </div>
  );
}
