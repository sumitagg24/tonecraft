import { useCallback } from "react";
import { usePromptsStore, type PromptItem, type PromptVariableDef } from "@/stores/prompts-store";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function usePrompts() {
  const fetchPrompts = useCallback(async (projectId?: string) => {
    const store = usePromptsStore.getState();
    store.setLoading(true);
    try {
      const url = projectId ? `/api/prompts?projectId=${encodeURIComponent(projectId)}` : "/api/prompts";
      const data = await api<{ prompts: PromptItem[]; categories: string[] }>(url);
      store.setPrompts(data.prompts ?? []);
      store.setCategories(data.categories ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load prompts");
    } finally {
      usePromptsStore.getState().setLoading(false);
    }
  }, []);

  const createPrompt = useCallback(async (data: {
    title: string; description?: string; content: string;
    category?: string; variables?: PromptVariableDef[]; projectId?: string;
  }) => {
    try {
      const prompt = await api<PromptItem>("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      usePromptsStore.getState().addPrompt(prompt);
      return prompt;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create prompt");
      throw e;
    }
  }, []);

  const updatePrompt = useCallback(async (id: string, patch: Partial<PromptItem>) => {
    try {
      await api(`/api/prompts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch {
      toast.error("Failed to update prompt");
      return false;
    }
    usePromptsStore.getState().updatePromptInList(id, patch);
    return true;
  }, []);

  const deletePrompt = useCallback(async (id: string) => {
    try {
      await api(`/api/prompts/${id}`, { method: "DELETE" });
    } catch {
      toast.error("Failed to delete prompt");
      return;
    }
    usePromptsStore.getState().removePrompt(id);
  }, []);

  const toggleFavorite = useCallback(async (id: string, favorite: boolean) => {
    await updatePrompt(id, { isFavorite: favorite });
  }, [updatePrompt]);

  const renderPrompt = useCallback(async (content: string, variables: Record<string, string>) => {
    const data = await api<{ rendered: string }>("/api/prompts/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, variables }),
    });
    return data.rendered;
  }, []);

  const importPrompts = useCallback(async (prompts: { title: string; description?: string; content: string; category?: string; variables?: PromptVariableDef[] }[]) => {
    try {
      const data = await api<{ imported: number }>("/api/prompts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts }),
      });
      return data.imported;
    } catch {
      toast.error("Failed to import prompts");
      return 0;
    }
  }, []);

  return {
    fetchPrompts, createPrompt, updatePrompt, deletePrompt,
    toggleFavorite, renderPrompt, importPrompts,
  };
}
