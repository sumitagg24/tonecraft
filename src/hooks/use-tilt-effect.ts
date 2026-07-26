"use client";
import { useCallback, useRef } from "react";
import { useReducedMotion } from "./use-reduced-motion";

interface TiltOptions {
  max?: number;
  scale?: number;
  perspective?: number;
  className?: string;
}

export function useTiltEffect(options: TiltOptions = {}) {
  const reduced = useReducedMotion();
  const { max = 6, scale = 1.01, perspective = 800 } = options;
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (y - 0.5) * max;
    const tiltY = (0.5 - x) * max;
    ref.current.style.transform = `perspective(${perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`;
  }, [reduced, max, scale, perspective]);

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}

export function useSpotlightEffect() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    ref.current.style.setProperty("--mouse-x", `${x}%`);
    ref.current.style.setProperty("--mouse-y", `${y}%`);
  }, [reduced]);

  return { ref, onMouseMove };
}
