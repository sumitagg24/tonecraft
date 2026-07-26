"use client";
import { useEffect } from "react";

type Shortcut = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  handler: (e: KeyboardEvent) => void;
};

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const matchKey = e.key.toLowerCase() === s.key.toLowerCase();
        const matchMeta = s.meta ? e.metaKey : true;
        const matchCtrl = s.ctrl ? e.ctrlKey : true;
        const matchShift = s.shift ? e.shiftKey : true;
        const noExtra = !s.meta && !s.ctrl && !s.shift
          ? true
          : !(e.key === "Meta" || e.key === "Control" || e.key === "Shift");
        if (matchKey && matchMeta && matchCtrl && matchShift && noExtra) {
          e.preventDefault();
          s.handler(e);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);
}
