"use client";
import { create } from "zustand";
import type { ProjectSummary } from "@/services/ProjectService";

interface ProjectsState {
  projects: ProjectSummary[];
  unfiled: number;
  currentProjectId: string | null;
  loading: boolean;
  setProjects: (projects: ProjectSummary[]) => void;
  setUnfiled: (count: number) => void;
  setCurrentProjectId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  addProject: (project: ProjectSummary) => void;
  updateProjectInList: (id: string, patch: Partial<ProjectSummary>) => void;
  removeProject: (id: string) => void;
}

export const useProjectsStore = create<ProjectsState>()((set) => ({
  projects: [],
  unfiled: 0,
  currentProjectId: null,
  loading: false,
  setProjects: (projects) => set({ projects }),
  setUnfiled: (unfiled) => set({ unfiled }),
  setCurrentProjectId: (currentProjectId) => set({ currentProjectId }),
  setLoading: (loading) => set({ loading }),
  addProject: (project) => set((s) => ({ projects: [project, ...s.projects] })),
  updateProjectInList: (id, patch) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  removeProject: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProjectId: s.currentProjectId === id ? null : s.currentProjectId,
    })),
}));
