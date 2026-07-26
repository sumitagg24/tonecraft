"use client";
import { create } from "zustand";

interface CommandPaletteState {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  open: () => void;
}

export const useCommandPalette = create<CommandPaletteState>((set) => ({
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
}));
