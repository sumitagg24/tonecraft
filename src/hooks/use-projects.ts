import { useCallback } from "react";
import { useProjectsStore } from "@/stores/projects-store";
import type { ProjectSummary } from "@/services/ProjectService";
import { toast } from "sonner";

export function useProjects() {
  const fetchProjects = useCallback(async () => {
    const store = useProjectsStore.getState();
    store.setLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      store.setProjects(data.projects ?? []);
      store.setUnfiled(data.unfiled ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      useProjectsStore.getState().setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (data: { name: string; emoji?: string; color?: string; description?: string; parentId?: string }) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast.error("Failed to create project");
      throw new Error("Failed to create project");
    }
    const project = await res.json();
    useProjectsStore.getState().addProject(project);
    return project as ProjectSummary;
  }, []);

  const updateProject = useCallback(async (id: string, patch: Partial<ProjectSummary>) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { toast.error("Failed to update project"); return; }
    useProjectsStore.getState().updateProjectInList(id, patch);
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete project"); return; }
    useProjectsStore.getState().removeProject(id);
  }, []);

  const createChatInProject = useCallback(async (projectId: string, data?: { title?: string }) => {
    const res = await fetch(`/api/projects/${projectId}/chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) throw new Error("Failed to create chat in project");
    return res.json();
  }, []);

  const moveChatToProject = useCallback(async (chatId: string, projectId: string | null) => {
    const res = await fetch(`/api/chats/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (!res.ok) { toast.error("Failed to move chat"); return false; }
    return true;
  }, []);

  return {
    fetchProjects, createProject, updateProject, deleteProject,
    createChatInProject, moveChatToProject,
  };
}
