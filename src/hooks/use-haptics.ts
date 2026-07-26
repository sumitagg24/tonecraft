"use client";

type HapticEvent = "success" | "error" | "generate" | "send" | "complete" | "notification" | "toggle" | "hover";

type HapticHandler = (event: HapticEvent) => void;

let customHandler: HapticHandler | null = null;

export function setHapticHandler(handler: HapticHandler) {
  customHandler = handler;
}

export function useHaptics() {
  const play = (event: HapticEvent) => {
    if (customHandler) {
      customHandler(event);
      return;
    }
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      const patterns: Record<HapticEvent, number[]> = {
        success: [10],
        error: [30, 50, 30],
        generate: [15, 30, 15],
        send: [20],
        complete: [10, 20, 10],
        notification: [15, 30, 15, 30, 15],
        toggle: [8],
        hover: [4],
      };
      navigator.vibrate(patterns[event]);
    }
  };

  return { play };
}
