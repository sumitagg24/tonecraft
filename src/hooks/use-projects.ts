import { useCallback } from "react";
import { useProjectsStore } from "@/stores/projects-store";
import type { ProjectSummary } from "@/services/ProjectService";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function useProjects() {
  const fetchProjects = useCallback(async () => {
    const store = useProjectsStore.getState();
    store.setLoading(true);
    try {
      const data = await api<{ projects: ProjectSummary[]; unfiled: number }>("/api/projects");
      store.setProjects(data.projects ?? []);
      store.setUnfiled(data.unfiled ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      useProjectsStore.getState().setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (data: { name: string; emoji?: string; color?: string; description?: string; parentId?: string }) => {
    try {
      const project = await api<ProjectSummary>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      useProjectsStore.getState().addProject(project);
      return project;
    } catch {
      toast.error("Failed to create project");
      throw new Error("Failed to create project");
    }
  }, []);

  const updateProject = useCallback(async (id: string, patch: Partial<ProjectSummary>) => {
    try {
      await api(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch {
      toast.error("Failed to update project");
      return;
    }
    useProjectsStore.getState().updateProjectInList(id, patch);
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await api(`/api/projects/${id}`, { method: "DELETE" });
    } catch {
      toast.error("Failed to delete project");
      return;
    }
    useProjectsStore.getState().removeProject(id);
  }, []);

  const createChatInProject = useCallback(async (projectId: string, data?: { title?: string }) => {
    return api<{ id: string; title: string }>(`/api/projects/${projectId}/chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });
  }, []);

  const moveChatToProject = useCallback(async (chatId: string, projectId: string | null) => {
    try {
      await api(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      return true;
    } catch {
      toast.error("Failed to move chat");
      return false;
    }
  }, []);

  return {
    fetchProjects, createProject, updateProject, deleteProject,
    createChatInProject, moveChatToProject,
  };
}
