"use client";
import { create } from "zustand";

export interface PromptVariableDef {
  name: string;
  label?: string;
  required?: boolean;
  options?: string[];
}

export interface PromptItem {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  content: string;
  category: string;
  variables: PromptVariableDef[] | null;
  isFavorite: boolean;
  isArchived: boolean;
  projectId: string | null;
  /** Optional tone tag — not all prompts carry one (API may omit it). */
  tone?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PromptsState {
  prompts: PromptItem[];
  categories: string[];
  loading: boolean;
  setPrompts: (prompts: PromptItem[]) => void;
  setCategories: (categories: string[]) => void;
  setLoading: (loading: boolean) => void;
  addPrompt: (prompt: PromptItem) => void;
  updatePromptInList: (id: string, patch: Partial<PromptItem>) => void;
  removePrompt: (id: string) => void;
}

export const usePromptsStore = create<PromptsState>()((set) => ({
  prompts: [],
  categories: [],
  loading: false,
  setPrompts: (prompts) => set({ prompts }),
  setCategories: (categories) => set({ categories }),
  setLoading: (loading) => set({ loading }),
  addPrompt: (prompt) => set((s) => ({ prompts: [prompt, ...s.prompts] })),
  updatePromptInList: (id, patch) =>
    set((s) => ({ prompts: s.prompts.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  removePrompt: (id) => set((s) => ({ prompts: s.prompts.filter((p) => p.id !== id) })),
}));
