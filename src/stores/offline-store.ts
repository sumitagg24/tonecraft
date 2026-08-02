"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PendingAction {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
}

interface OfflineState {
  online: boolean;
  pending: PendingAction[];
  syncing: boolean;
  lastSync: string | null;
  setOnline: (online: boolean) => void;
  addPending: (action: PendingAction) => void;
  removePending: (id: string) => void;
  clearPending: () => void;
  setSyncing: (syncing: boolean) => void;
  setLastSync: (date: string) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      online: typeof navigator !== "undefined" ? navigator.onLine : true,
      pending: [],
      syncing: false,
      lastSync: null,
      setOnline: (online) => set({ online }),
      addPending: (action) =>
        set((s) => ({ pending: [...s.pending, action] })),
      removePending: (id) =>
        set((s) => ({
          pending: s.pending.filter((a) => a.id !== id),
        })),
      clearPending: () => set({ pending: [] }),
      setSyncing: (syncing) => set({ syncing }),
      setLastSync: (date) => set({ lastSync: date }),
    }),
    { name: "tonecraft-offline" }
  )
);