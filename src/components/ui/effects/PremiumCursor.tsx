"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function PremiumCursor() {
  const reduced = useReducedMotion();
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const glowX = useMotionValue(-100);
  const glowY = useMotionValue(-100);
  const trailX = useMotionValue(-100);
  const trailY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.2 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  const trailXSpring = useSpring(trailX, { ...springConfig, mass: 0.4 });
  const trailYSpring = useSpring(trailY, { ...springConfig, mass: 0.4 });

  const isPointer = useRef(false);

  useEffect(() => {
    if (reduced || typeof window === "undefined") return;

    const onMouse = (e: MouseEvent) => {
      cursorX.set(e.clientX - 12);
      cursorY.set(e.clientY - 12);
      glowX.set(e.clientX - 100);
      glowY.set(e.clientY - 100);
      trailX.set(e.clientX - 4);
      trailY.set(e.clientY - 4);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [role='button'], input, textarea, select, [data-magnetic]")) {
        isPointer.current = true;
        document.body.style.cursor = "pointer";
      }
    };

    const onOut = () => {
      isPointer.current = false;
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouse);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, [reduced, cursorX, cursorY, glowX, glowY, trailX, trailY]);

  if (reduced) return null;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-[200px] h-[200px] rounded-full pointer-events-none z-[9999] opacity-30"
        style={{
          x: glowX,
          y: glowY,
          background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-6 h-6 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          backgroundColor: "hsl(var(--foreground))",
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999] opacity-40"
        style={{
          x: trailXSpring,
          y: trailYSpring,
          backgroundColor: "hsl(var(--foreground))",
        }}
      />
    </>
  );
}
