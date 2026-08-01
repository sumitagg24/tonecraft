"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WorkspaceMode = "chat" | "focus" | "writer" | "split" | "compact" | "minimal";

interface AdvancedControls {
  tone: string;
  language: string;
  ageGroup: string;
  platform: string;
  audience: string;
  writingStyle: string;
  creativity: number;
  responseLength: "short" | "medium" | "long";
  emojiLevel: "none" | "subtle" | "moderate" | "heavy";
  outputFormat: "text" | "markdown" | "html";
  readingLevel: "basic" | "intermediate" | "advanced";
  provider: string;
  workflow: string;
  preset: string;
}

interface WorkspaceState {
  mode: WorkspaceMode;
  sidebarOpen: boolean;
  sidebarWidth: number;
  contextPanelOpen: boolean;
  contextPanelWidth: number;
  showAdvancedControls: boolean;
  showSuggestions: boolean;
  advanced: AdvancedControls;
  composerHeight: number;
  mobileSidebarOpen: boolean;
  mobileContextOpen: boolean;

  setMode: (mode: WorkspaceMode) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setContextPanelOpen: (open: boolean) => void;
  toggleContextPanel: () => void;
  setContextPanelWidth: (width: number) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setMobileContextOpen: (open: boolean) => void;
  setShowAdvancedControls: (show: boolean) => void;
  toggleAdvancedControls: () => void;
  setShowSuggestions: (show: boolean) => void;
  setAdvanced: (controls: Partial<AdvancedControls>) => void;
  setComposerHeight: (height: number) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      mode: "chat",
      sidebarOpen: true,
      sidebarWidth: 280,
      contextPanelOpen: true,
      contextPanelWidth: 320,
      showAdvancedControls: false,
      showSuggestions: true,
      advanced: {
        tone: "professional",
        language: "en",
        ageGroup: "adult",
        platform: "email",
        audience: "",
        writingStyle: "balanced",
        creativity: 70,
        responseLength: "medium",
        emojiLevel: "subtle",
        outputFormat: "text",
        readingLevel: "intermediate",
        provider: "auto",
        workflow: "direct",
        preset: "",
      },
      composerHeight: 48,
      mobileSidebarOpen: false,
      mobileContextOpen: false,

      setMode: (mode) => set({ mode }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setContextPanelOpen: (open) => set({ contextPanelOpen: open }),
      toggleContextPanel: () => set((s) => ({ contextPanelOpen: !s.contextPanelOpen })),
      setContextPanelWidth: (width) => set({ contextPanelWidth: width }),
      setShowAdvancedControls: (show) => set({ showAdvancedControls: show }),
      toggleAdvancedControls: () => set((s) => ({ showAdvancedControls: !s.showAdvancedControls })),
      setShowSuggestions: (show) => set({ showSuggestions: show }),
      setAdvanced: (controls) => set((s) => ({ advanced: { ...s.advanced, ...controls } })),
      setComposerHeight: (height) => set({ composerHeight: height }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setMobileContextOpen: (open) => set({ mobileContextOpen: open }),
    }),
    {
      name: "tonecraft-workspace",
      partialize: (s) => ({ mode: s.mode, sidebarOpen: s.sidebarOpen, contextPanelOpen: s.contextPanelOpen }),
    }
  )
);
