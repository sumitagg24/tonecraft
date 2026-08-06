"use client";
import React, { createContext, useContext, useCallback, useRef } from "react";

interface PendingUpdate {
  id: string;
  key: string;
  optimisticData: Record<string, unknown>;
  rollbackData: Record<string, unknown>;
  timestamp: number;
}

interface OptimisticUpdateContextType {
  registerUpdate: (update: PendingUpdate) => void;
  confirmUpdate: (id: string) => void;
  rollbackUpdate: (id: string) => void;
  getPendingUpdates: (key: string) => PendingUpdate[];
  clearUpdates: (key: string) => void;
}

const OptimisticUpdateContext = createContext<OptimisticUpdateContextType | null>(null);

export function OptimisticUpdateProvider({ children }: { children: React.ReactNode }) {
  const pendingRef = useRef<Map<string, PendingUpdate[]>>(new Map());

  const registerUpdate = useCallback((update: PendingUpdate) => {
    const key = update.key;
    const current = pendingRef.current.get(key) ?? [];
    pendingRef.current.set(key, [...current, update]);
  }, []);

  const confirmUpdate = useCallback((id: string) => {
    for (const [key, updates] of pendingRef.current) {
      const idx = updates.findIndex((u) => u.id === id);
      if (idx !== -1) {
        const remaining = updates.filter((_, i) => i !== idx);
        if (remaining.length === 0) {
          pendingRef.current.delete(key);
        } else {
          pendingRef.current.set(key, remaining);
        }
        break;
      }
    }
  }, []);

  const rollbackUpdate = useCallback((id: string) => {
    for (const [key, updates] of pendingRef.current) {
      const update = updates.find((u) => u.id === id);
      if (update) {
        const remaining = updates.filter((_, i) => i !== updates.indexOf(update));
        if (remaining.length === 0) {
          pendingRef.current.delete(key);
        } else {
          pendingRef.current.set(key, remaining);
        }
        return update.rollbackData;
      }
    }
    return null;
  }, []);

  const getPendingUpdates = useCallback((key: string) => {
    return pendingRef.current.get(key) ?? [];
  }, []);

  const clearUpdates = useCallback((key: string) => {
    pendingRef.current.delete(key);
  }, []);

  return (
    <OptimisticUpdateContext.Provider value={{ registerUpdate, confirmUpdate, rollbackUpdate, getPendingUpdates, clearUpdates }}>
      {children}
    </OptimisticUpdateContext.Provider>
  );
}

export function useOptimisticUpdates() {
  const ctx = useContext(OptimisticUpdateContext);
  if (!ctx) {
    throw new Error("useOptimisticUpdates must be used within OptimisticUpdateProvider");
  }
  return ctx;
}