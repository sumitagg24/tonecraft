"use client";
import { useCallback, useRef } from "react";
import { useReducedMotion } from "./use-reduced-motion";

export function useClickRipple() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const ripple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (reduced) return;
    const target = e.currentTarget;
    const existing = target.querySelector(".click-ripple");
    if (existing) existing.remove();

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const el = document.createElement("span");
    el.className = "click-ripple";
    el.style.cssText = `
      position: absolute; border-radius: 50%; pointer-events: none;
      width: ${size}px; height: ${size}px; left: ${x}px; top: ${y}px;
      background: hsl(var(--primary) / 0.15);
      transform: scale(0); animation: click-ripple 0.6s ease-out forwards;
    `;
    target.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }, [reduced]);

  return { ripple, containerRef };
}

export function useMagneticEffect() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const dist = Math.sqrt(x * x + y * y);
    const strength = Math.min(12, dist * 0.12);
    const angle = Math.atan2(y, x);
    ref.current.style.transform = `translate(${Math.cos(angle) * strength}px, ${Math.sin(angle) * strength}px)`;
  }, [reduced]);

  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "translate(0, 0)";
  }, []);

  return { ref, onMove, onLeave };
}
