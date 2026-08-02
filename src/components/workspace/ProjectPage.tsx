"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProjectsStore } from "@/stores/projects-store";
import { useProjects } from "@/hooks/use-projects";
import { useChat } from "@/hooks/use-chat";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Plus, MessageSquare, Pencil, Trash2, Check, X, FolderOpen,
  Files, BookOpen, Users, Settings,
} from "lucide-react";

interface ProjectPageProps {
  projectId: string;
}

type Tab = "chats" | "files" | "prompts" | "personas" | "settings";

export function ProjectPage({ projectId }: ProjectPageProps) {
  const router = useRouter();
  const { projects, setCurrentProjectId } = useProjectsStore();
  const { fetchProjects, updateProject, deleteProject, createChatInProject } = useProjects();
  const { fetchChats } = useChat();
  const chats = useChatStore((s) => s.chats);
  const [tab, setTab] = useState<Tab>("chats");
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");

  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    setCurrentProjectId(projectId);
    fetchProjects();
    fetchChats();
  }, [projectId, setCurrentProjectId, fetchProjects, fetchChats]);

  const projectChats = chats.filter((c) => c.projectId === projectId);

  const handleCreateChat = useCallback(async () => {
    const chat = await createChatInProject(projectId);
    router.push(`/p/${projectId}/chats/${chat.id}`);
  }, [projectId, createChatInProject, router]);

  const handleSaveName = useCallback(async () => {
    if (name.trim()) await updateProject(projectId, { name: name.trim() });
    setEditingName(false);
  }, [name, projectId, updateProject]);

  const handleDelete = useCallback(async () => {
    if (confirm(`Delete "${project?.name}"? Its chats will move to All chats.`)) {
      await deleteProject(projectId);
      router.push("/chat");
    }
  }, [deleteProject, project?.name, projectId, router]);

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "chats", label: "Chats", icon: MessageSquare },
    { id: "files", label: "Files", icon: Files },
    { id: "prompts", label: "Prompts", icon: BookOpen },
    { id: "personas", label: "Personas", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${project.color}22` }}
        >
          {project.emoji || <FolderOpen className="w-5 h-5" style={{ color: project.color }} />}
        </div>
        {editingName ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
              className="flex-1 max-w-xs h-9 bg-muted/30 border border-border/40 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={handleSaveName} className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-foreground" aria-label="Save"><Check className="w-4 h-4" /></button>
            <button onClick={() => setEditingName(false)} className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-foreground" aria-label="Cancel"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <h1 className="text-lg font-bold tracking-tight">{project.name}</h1>
              {project.description && <p className="text-xs text-muted-foreground/60 mt-0.5">{project.description}</p>}
            </div>
            <button
              onClick={() => { setEditingName(true); setName(project.name); }}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-all"
              aria-label="Rename project"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all"
              aria-label="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/20 mb-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all",
              tab === t.id ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {tab === t.id && (
              <motion.div layoutId="project-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {tab === "chats" && (
          <div>
            <button
              onClick={handleCreateChat}
              className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl border border-dashed border-border/40 text-xs text-muted-foreground/60 hover:text-foreground hover:border-primary/40 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New chat in {project.name}
            </button>
            <div className="mt-3 space-y-1">
              {projectChats.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground/40 py-8">No chats in this project yet.</p>
              ) : (
                projectChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => router.push(`/p/${projectId}/chats/${chat.id}`)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/20 hover:bg-muted/20 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-muted-foreground/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{chat.title}</p>
                      <p className="text-[10px] text-muted-foreground/40">
                        {new Date(chat.updatedAt).toLocaleDateString()} · {chat._count?.messages ?? 0} messages
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "files" && (
          <div className="py-8 text-center">
            <Files className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground/60">Project knowledge files arrive with the Knowledge Base feature.</p>
          </div>
        )}

        {tab === "prompts" && (
          <div className="py-8 text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground/60">Project prompt library arrives with the Prompt Library feature.</p>
          </div>
        )}

        {tab === "personas" && (
          <div className="py-8 text-center">
            <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground/60">Project personas arrive with the Personas feature.</p>
          </div>
        )}

        {tab === "settings" && (
          <div className="max-w-md space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground/70">Project name</label>
              <input
                value={name || project.name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSaveName}
                className="mt-1 w-full h-9 bg-muted/30 border border-border/40 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground/70">Emoji</label>
              <input
                value={project.emoji || ""}
                onChange={(e) => updateProject(projectId, { emoji: e.target.value })}
                className="mt-1 w-full h-9 bg-muted/30 border border-border/40 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. 🚀"
                maxLength={10}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground/70">Color</label>
              <input
                type="color"
                value={project.color}
                onChange={(e) => updateProject(projectId, { color: e.target.value })}
                className="mt-1 h-9 w-16 rounded-lg border border-border/40 bg-muted/30 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground/70">Description</label>
              <textarea
                value={project.description || ""}
                onChange={(e) => updateProject(projectId, { description: e.target.value })}
                className="mt-1 w-full min-h-[72px] bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="What is this project about?"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
