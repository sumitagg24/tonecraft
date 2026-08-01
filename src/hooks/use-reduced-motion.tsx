"use client";
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

const ReducedMotionContext = createContext(false);

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshotReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshotReducedMotion() {
  return false;
}

export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const prefersReduced = useSyncExternalStore(
    subscribeReducedMotion,
    getSnapshotReducedMotion,
    getServerSnapshotReducedMotion
  );

  return (
    <ReducedMotionContext.Provider value={prefersReduced}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotion() {
  return useContext(ReducedMotionContext);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSafeTransition(transition: any) {
  const reduced = useReducedMotion();
  return reduced ? { duration: 0 } : transition;
}
