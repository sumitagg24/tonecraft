"use client";
import { WifiOff } from "lucide-react";

interface OfflineIndicatorProps {
  online: boolean;
}

export function OfflineIndicator({ online }: OfflineIndicatorProps) {
  if (online) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30 text-xs text-destructive shadow-lg">
      <WifiOff className="w-3.5 h-3.5" />
      <span className="font-medium">Offline</span>
      <span className="text-destructive/60">— drafts saved locally</span>
    </div>
  );
}