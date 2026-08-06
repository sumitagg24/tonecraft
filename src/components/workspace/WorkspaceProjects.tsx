"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Trash2, Edit2, Folder, FolderPlus, Settings, Calendar, MessageSquare } from "lucide-react";
import { useWorkspace } from "@/hooks/workspace/useWorkspace";

interface WorkspaceProjectsProps {
  workspaceId: string;
}

interface ProjectItem {
  id: string;
  name: string;
  emoji?: string | null;
  color: string;
  description?: string | null;
  createdAt: string;
  _count?: { chats?: number };
}

export function WorkspaceProjects({ workspaceId }: WorkspaceProjectsProps) {
  const { workspace } = useWorkspace(workspaceId);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/workspaces/${workspaceId}/projects`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to fetch projects");
        setProjects(data.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchProjects();
    }
  }, [workspaceId]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    try {
      await fetch(`/api/workspaces/${workspaceId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName }),
      });
      setShowAddProject(false);
      setProjectName("");
      // Refresh projects
      const res = await fetch(`/api/workspaces/${workspaceId}/projects`);
      const data = await res.json();
      setProjects(data.data);
    } catch (e) {
      console.error("Failed to create project", e);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try {
      await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`, {
        method: "DELETE",
      });
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (e) {
      console.error("Failed to delete project", e);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading projects...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Projects ({projects.length})</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowAddProject(true)}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No projects yet. Create your first project to get started.</p>
          <Button variant="outline" onClick={() => setShowAddProject(true)}>
            <FolderPlus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => (
          <div key={project.id} className="group">
            <Link href={`/p/${project.id}`} passHref>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-${getBadgeColor(project.color)} flex items-center justify-center`}>
                        {project.emoji ?? <Folder className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.description || "No description"}</p>
                      </div>
                    </div>
                    <div className="space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/p/${project.id}`}>
                          <Folder className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span>{project._count?.chats || 0} chats</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-4">
                  <Button variant="outline" size="icon" onClick={(e) => {
                    e.stopPropagation();
                    setShowSettings(true);
                  }}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      <ProjectSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        workspace={workspace}
      />

      <AddProjectModal
        open={showAddProject}
        onOpenChange={setShowAddProject}
        onCreateProject={handleCreateProject}
        projectName={projectName}
        setProjectName={setProjectName}
      />
    </div>
  );
}

function getBadgeColor(color: string): string {
  if (!color) return "gray-200";
  // Extract brightness from hex color
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 125 ? "gray-800" : "gray-100";
}

// Helper component for modals
function ProjectSettingsModal({ open, onOpenChange, workspace }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: {
    name?: string;
    description?: string | null;
    color?: string;
    visibility?: string;
  } | null | undefined;
}) {
  // Simplified version for now - in production would use the actual ProjectSettings component
  const ws = workspace ?? {};
  return (
    <div className={open ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50" : "hidden"}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Workspace Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Workspace Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              defaultValue={ws.name}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full p-2 border rounded-md"
              defaultValue={ws.description || ""}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <input
              type="color"
              className="w-full p-2"
              defaultValue={ws.color}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Visibility</label>
            <select className="w-full p-2 border rounded-md" defaultValue={ws.visibility}>
              <option value="private">Private</option>
              <option value="shared">Shared</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function AddProjectModal({ open, onOpenChange, onCreateProject, projectName, setProjectName }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: () => Promise<void>;
  projectName: string;
  setProjectName: (name: string) => void;
}) {
  return (
    <div className={open ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50" : "hidden"}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create New Project</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          await onCreateProject();
          onOpenChange(false);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Project Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}