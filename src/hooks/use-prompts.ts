import { useCallback } from "react";
import { usePromptsStore, type PromptItem, type PromptVariableDef } from "@/stores/prompts-store";
import { toast } from "sonner";

export function usePrompts() {
  const fetchPrompts = useCallback(async (projectId?: string) => {
    const store = usePromptsStore.getState();
    store.setLoading(true);
    try {
      const url = projectId ? `/api/prompts?projectId=${encodeURIComponent(projectId)}` : "/api/prompts";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load prompts");
      const data = await res.json();
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
    const res = await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Failed to create prompt"); throw new Error("Failed to create prompt"); }
    const prompt = await res.json();
    usePromptsStore.getState().addPrompt(prompt);
    return prompt as PromptItem;
  }, []);

  const updatePrompt = useCallback(async (id: string, patch: Partial<PromptItem>) => {
    const res = await fetch(`/api/prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { toast.error("Failed to update prompt"); return false; }
    usePromptsStore.getState().updatePromptInList(id, patch);
    return true;
  }, []);

  const deletePrompt = useCallback(async (id: string) => {
    const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete prompt"); return; }
    usePromptsStore.getState().removePrompt(id);
  }, []);

  const toggleFavorite = useCallback(async (id: string, favorite: boolean) => {
    await updatePrompt(id, { isFavorite: favorite });
  }, [updatePrompt]);

  const renderPrompt = useCallback(async (content: string, variables: Record<string, string>) => {
    const res = await fetch("/api/prompts/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, variables }),
    });
    if (!res.ok) throw new Error("Failed to render prompt");
    const data = await res.json();
    return data.rendered as string;
  }, []);

  const importPrompts = useCallback(async (prompts: { title: string; description?: string; content: string; category?: string; variables?: PromptVariableDef[] }[]) => {
    const res = await fetch("/api/prompts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompts }),
    });
    if (!res.ok) { toast.error("Failed to import prompts"); return 0; }
    const data = await res.json();
    return data.imported as number;
  }, []);

  return {
    fetchPrompts, createPrompt, updatePrompt, deletePrompt,
    toggleFavorite, renderPrompt, importPrompts,
  };
}
