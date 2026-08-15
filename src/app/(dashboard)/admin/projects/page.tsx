"use client";
import { useCallback } from "react";
import { Folder, RefreshCw, ExternalLink, Archive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPageSkeleton } from "@/components/shared/AdminPageSkeleton";
import { useAdminMetrics } from "@/hooks/use-admin-metrics";
import { formatCompactNumber } from "@/lib/utils";

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
  const { data, loading, refetch } = useAdminMetrics<ProjectsData>({
    path: useCallback(
      (workspaceId: string) => `/api/admin/metrics/projects?workspaceId=${workspaceId}`,
      []
    ),
    errorMessage: "Failed to load projects data",
  });

  if (loading) {
    return <AdminPageSkeleton count={5} />;
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
            {data.totalProjects} projects, {formatCompactNumber(data.totalMessages)} messages
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
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
            <p className="text-2xl font-bold">{formatCompactNumber(data.aiUsage.tokens)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">AI Requests</span>
            </div>
            <p className="text-2xl font-bold">{formatCompactNumber(data.aiUsage.requests)}</p>
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
