"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NavigationState {
  railCollapsed: boolean;
  mobileNavOpen: boolean;
  setRailCollapsed: (collapsed: boolean) => void;
  toggleRailCollapsed: () => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      railCollapsed: false,
      mobileNavOpen: false,
      setRailCollapsed: (collapsed) => set({ railCollapsed: collapsed }),
      toggleRailCollapsed: () => set((s) => ({ railCollapsed: !s.railCollapsed })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
    }),
    { name: "tonecraft-navigation" }
  )
);
