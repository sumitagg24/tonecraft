"use client";
import { create } from "zustand";

export type WorkspaceMode = "chat" | "focus" | "writer" | "split" | "compact" | "minimal";

interface WorkspaceMemberState {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: "member" | "manager" | "admin";
  online: boolean;
  cursorX?: number;
  cursorY?: number;
}

interface SharedDocumentState {
  content: string;
  version: number;
  lastUpdated: string;
}

interface WorkspaceDataState {
  mode: WorkspaceMode;
  sidebarOpen: boolean;
  sidebarWidth: number;
  contextPanelOpen: boolean;
  contextPanelWidth: number;
  showAdvancedControls: boolean;
  showSuggestions: boolean;
  composerHeight: number;
  mobileSidebarOpen: boolean;
  mobileContextOpen: boolean;
  typingUsers: string[];
  presence: Record<string, WorkspaceMemberState>;
  sharedDocuments: Record<string, SharedDocumentState>;
}

interface WorkspaceUIState {
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
  setComposerHeight: (height: number) => void;
}

interface WorkspaceCollaborationState {
  addTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;
  clearTypingUsers: () => void;
  setUserPresence: (userId: string, state: Partial<WorkspaceMemberState>) => void;
  removeUserPresence: (userId: string) => void;
  updateSharedDocument: (docId: string, content: string, version: number) => void;
}

type WorkspaceStoreState = WorkspaceDataState & WorkspaceUIState & WorkspaceCollaborationState;

export const useWorkspaceStore = create<WorkspaceStoreState>()(
  (set) => ({
    mode: "chat",
    sidebarOpen: true,
    sidebarWidth: 280,
    // AI Context panel is hidden by default — opened on demand via the
    // right-panel toggle in the chat header (user request).
    contextPanelOpen: false,
    contextPanelWidth: 320,
    showAdvancedControls: false,
    showSuggestions: true,
    composerHeight: 48,
    mobileSidebarOpen: false,
    mobileContextOpen: false,
    typingUsers: [],
    presence: {},
    sharedDocuments: {},

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
    setComposerHeight: (height) => set({ composerHeight: height }),
    setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
    setMobileContextOpen: (open) => set({ mobileContextOpen: open }),

    addTypingUser: (userId) =>
      set((state) => ({
        typingUsers: state.typingUsers.includes(userId)
          ? state.typingUsers
          : [...state.typingUsers, userId],
      })),
    removeTypingUser: (userId) =>
      set((state) => ({
        typingUsers: state.typingUsers.filter((id) => id !== userId),
      })),
    clearTypingUsers: () => set({ typingUsers: [] }),
    setUserPresence: (userId, state) =>
      set((prev) => {
        const existing = prev.presence[userId];
        return {
          presence: {
            ...prev.presence,
            [userId]: {
              userId,
              name: existing?.name ?? "",
              email: existing?.email ?? "",
              image: existing?.image ?? null,
              role: existing?.role ?? "member",
              online: true,
              ...state,
            },
          },
        };
      }),
    removeUserPresence: (userId) =>
      set((state) => {
        const next = { ...state.presence };
        delete next[userId];
        return { presence: next };
      }),
    updateSharedDocument: (docId, content, version) =>
      set((state) => ({
        sharedDocuments: {
          ...state.sharedDocuments,
          [docId]: { content, version, lastUpdated: new Date().toISOString() },
        },
      })),
  }),
);

export type { WorkspaceMemberState, SharedDocumentState, WorkspaceDataState, WorkspaceUIState, WorkspaceCollaborationState };
