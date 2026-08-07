"use client";
import { useState, useEffect, useCallback } from "react";
import { Folder, RefreshCw, ExternalLink, Archive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface ProjectsData {
  totalProjects: number;
  totalMessages: number;
  aiUsage: { tokens: number; requests: number };
  projects: Array<{
    id: string;
    name: string;
    emoji: string | null;
    color: string;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
    stats: { chats: number; personas: number; knowledgeFiles: number };
  }>;
  period: string;
}

export default function AdminProjectsPage() {
  const [data, setData] = useState<ProjectsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaceId = useCallback(async (): Promise<string | null> => {
    const workspaces = await api<Array<{ id: string }>>("/api/workspaces");
    return workspaces?.[0]?.id ?? null;
  }, []);

  const fetchData = useCallback(async () => {
    const workspaceId = await fetchWorkspaceId();
    if (!workspaceId) return;
    setLoading(true);
    try {
      const d = await api<ProjectsData>(`/api/admin/metrics/projects?workspaceId=${workspaceId}`);
      setData(d);
    } catch {
      toast.error("Failed to load projects data");
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No projects data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.totalProjects} projects, {formatNumber(data.totalMessages)} messages
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-brand" />
              <span className="text-xs text-muted-foreground">Total Projects</span>
            </div>
            <p className="text-2xl font-bold">{data.totalProjects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">AI Tokens Used</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(data.aiUsage.tokens)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">AI Requests</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(data.aiUsage.requests)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {data.projects.map((p) => (
          <Card key={p.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.emoji ?? "📁"}
                  </div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.stats.chats} chats · {p.stats.personas} personas · {p.stats.knowledgeFiles} knowledge files
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.archived && (
                    <Archive className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/p/${p.id}`, "_blank")}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {data.projects.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">No projects found</p>
        )}
      </div>
    </div>
  );
}
