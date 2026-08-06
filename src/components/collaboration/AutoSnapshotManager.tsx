"use client";
import { useEffect, useRef } from "react";
import { useCreateSnapshot } from "@/hooks/use-version-history";
import { useOptimisticUpdates } from "@/components/collaboration/OptimisticUpdateProvider";

interface AutoSnapshotManagerProps {
  resourceType: string;
  resourceId: string;
  userId: string;
  intervalMs?: number;
  enabled?: boolean;
}

export function AutoSnapshotManager({ resourceType, resourceId, userId, intervalMs = 30000, enabled = true }: AutoSnapshotManagerProps) {
  const createSnapshot = useCreateSnapshot();
  const { registerUpdate } = useOptimisticUpdates();
  const lastSnapshotRef = useRef<number>(Date.now());
  const contentRef = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSnapshotRef.current >= intervalMs && contentRef.current) {
        createSnapshot.mutate({
          resourceType,
          resourceId,
          userId,
          content: contentRef.current,
          changeType: "auto-snapshot",
          changeSummary: "Automatic snapshot",
          isAuto: true,
        });
        lastSnapshotRef.current = now;
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [resourceType, resourceId, userId, intervalMs, enabled, createSnapshot]);

  const registerContent = (content: Record<string, unknown>) => {
    contentRef.current = content;
    registerUpdate({
      id: crypto.randomUUID(),
      key: `${resourceType}:${resourceId}`,
      optimisticData: content,
      rollbackData: content,
      timestamp: Date.now(),
    });
  };

  return { registerContent };
}