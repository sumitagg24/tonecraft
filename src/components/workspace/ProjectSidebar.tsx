"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectsStore } from "@/stores/projects-store";
import { useProjects } from "@/hooks/use-projects";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";
import {
  Folder, FolderOpen, ChevronRight, Plus, Inbox,
  Pencil, Trash2, Check, X, FolderPlus,
} from "lucide-react";

export function ProjectSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { projects, unfiled, loading, setCurrentProjectId } = useProjectsStore();
  const { fetchProjects, createProject, updateProject, deleteProject } = useProjects();
  const { chats } = useChatStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const projectChatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const chat of chats) {
      if (chat.projectId) counts[chat.projectId] = (counts[chat.projectId] || 0) + 1;
    }
    return counts;
  }, [chats]);

  const topLevel = useMemo(() => projects.filter((p) => !p.parentId), [projects]);
  const childrenOf = useCallback((id: string) => projects.filter((p) => p.parentId === id), [projects]);

  const activeProjectId = pathname.startsWith("/p/") ? pathname.split("/p/")[1]?.split("/")[0] : null;

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    try {
      const project = await createProject({ name: newName.trim() });
      setNewName("");
      setCreating(false);
      router.push(`/p/${project.id}`);
    } catch {
      /* toast handled in hook */
    }
  }, [newName, createProject, router]);

  const handleRename = useCallback(async (id: string) => {
    if (editName.trim()) await updateProject(id, { name: editName.trim() });
    setEditingId(null);
  }, [editName, updateProject]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteProject(id);
  }, [deleteProject]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Projects</span>
          <button
            onClick={() => setCreating(true)}
            className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all"
            aria-label="New project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {creating && (
          <div className="flex items-center gap-1.5 px-1 mb-1">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setCreating(false); setNewName(""); }
              }}
              placeholder="Project name"
              className="flex-1 h-7 bg-muted/30 border border-border/40 rounded-md px-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={handleCreate} className="h-6 w-6 rounded-md text-muted-foreground/60 hover:text-foreground" aria-label="Save project"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setCreating(false); setNewName(""); }} className="h-6 w-6 rounded-md text-muted-foreground/60 hover:text-foreground" aria-label="Cancel"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin px-2 pb-2 space-y-0.5">
        {/* Unfiled / All chats */}
        <button
          onClick={() => { setCurrentProjectId(null); router.push("/chat"); }}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs transition-all",
            !activeProjectId && pathname.startsWith("/chat")
              ? "bg-muted/50 text-foreground border border-border/30"
              : "text-muted-foreground/70 hover:bg-muted/20 hover:text-foreground"
          )}
        >
          <Inbox className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left truncate">All chats</span>
          <span className="text-[10px] text-muted-foreground/40">{unfiled}</span>
        </button>

        {loading ? (
          <p className="px-2 py-3 text-[11px] text-muted-foreground/40">Loading projects…</p>
        ) : topLevel.length === 0 && !creating ? (
          <p className="px-2 py-3 text-[11px] text-muted-foreground/40">
            No projects yet. Create one to organize your chats.
          </p>
        ) : (
          topLevel.map((project) => {
            const childProjects = childrenOf(project.id);
            const chatCount = (projectChatCounts[project.id] || 0) + childProjects.reduce((n, c) => n + (projectChatCounts[c.id] || 0), 0);
            const isOpen = !collapsed[project.id];
            const isActive = activeProjectId === project.id;
            return (
              <div key={project.id}>
                <div
                  className={cn(
                    "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs transition-all cursor-pointer",
                    isActive ? "bg-muted/50 text-foreground border border-border/30" : "text-muted-foreground/80 hover:bg-muted/20 hover:text-foreground"
                  )}
                  onClick={() => { setCurrentProjectId(project.id); router.push(`/p/${project.id}`); }}
                >
                  {childProjects.length > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCollapsed((c) => ({ ...c, [project.id]: !c[project.id] })); }}
                      className="h-5 w-5 flex items-center justify-center text-muted-foreground/40 hover:text-foreground"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                      <ChevronRight className={cn("w-3 h-3 transition-transform", isOpen && "rotate-90")} />
                    </button>
                  )}
                  <span className="text-sm shrink-0">{project.emoji || <FolderOpen className="w-3.5 h-3.5 text-muted-foreground/60" />}</span>
                  {editingId === project.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRename(project.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRename(project.id); if (e.key === "Escape") setEditingId(null); }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-muted/40 border border-border/40 rounded px-1.5 py-0.5 text-xs outline-none"
                    />
                  ) : (
                    <span className="flex-1 text-left truncate">{project.name}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground/40">{chatCount}</span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(project.id); setEditName(project.name); }}
                      className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground"
                      aria-label="Rename project"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                      className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-destructive"
                      aria-label="Delete project"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isOpen && childProjects.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-4 border-l border-border/20 pl-1 overflow-hidden"
                    >
                      {childProjects.map((child) => (
                        <div
                          key={child.id}
                          onClick={() => router.push(`/p/${child.id}`)}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all",
                            activeProjectId === child.id ? "bg-muted/50 text-foreground" : "text-muted-foreground/70 hover:bg-muted/20 hover:text-foreground"
                          )}
                        >
                          <Folder className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                          <span className="flex-1 truncate">{child.name}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}

        <div className="h-2" />
        <button
          onClick={() => { setCreating(true); }}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground/50 hover:text-foreground hover:bg-muted/20 transition-all"
        >
          <FolderPlus className="w-3 h-3" />
          New project
        </button>
      </div>
    </div>
  );
}
