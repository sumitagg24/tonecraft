"use client";
/**
 * @author: @dorianbaffier
 * @description: Shimmer Text
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShimmerTextProps {
  text: string;
  className?: string;
  /** Override the wrapper layout (default: centered with padding). */
  wrapperClassName?: string;
  /** Override the inner clipping box padding. */
  innerClassName?: string;
}

export default function ShimmerText({
  text = "Text Shimmer",
  className,
  wrapperClassName,
  innerClassName,
}: ShimmerTextProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={cn("flex items-center justify-center p-8", wrapperClassName)}>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={cn("relative overflow-hidden px-4 py-2", innerClassName)}
        initial={{ opacity: 0, y: 20 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }
        }
      >
        <motion.h1
          animate={{
            backgroundPosition: ["200% center", "-200% center"],
          }}
          className={cn(
            "bg-[length:200%_100%] bg-gradient-to-r from-neutral-950 via-neutral-400 to-neutral-950 bg-clip-text font-bold text-3xl text-transparent dark:from-white dark:via-neutral-600 dark:to-white",
            className
          )}
          transition={
            shouldReduceMotion
              ? { duration: 0, repeat: 0 }
              : {
                  duration: 2.5,
                  ease: "linear",
                  repeat: Number.POSITIVE_INFINITY,
                }
          }
        >
          {text}
        </motion.h1>
      </motion.div>
    </div>
  );
}
