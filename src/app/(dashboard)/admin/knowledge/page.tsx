"use client";
import { useState, useEffect, useCallback } from "react";
import { BookOpen, RefreshCw, FileText, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

interface KnowledgeData {
  totalFiles: number;
  totalBytes: number;
  byStatus: Array<{ status: string; count: number; bytes: number }>;
  recentFiles: Array<{
    id: string;
    name: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    status: string;
    createdAt: string;
    projectId: string | null;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  ready: "bg-green-500/10 text-green-500",
  pending: "bg-amber-500/10 text-amber-500",
  processing: "bg-blue-500/10 text-blue-500",
  failed: "bg-red-500/10 text-red-500",
};

export default function AdminKnowledgePage() {
  const [data, setData] = useState<KnowledgeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaceId = useCallback(async (): Promise<string | null> => {
    const workspaces = await api<any[]>("/api/workspaces");
    return workspaces?.[0]?.id ?? null;
  }, []);

  const fetchData = useCallback(async () => {
    const workspaceId = await fetchWorkspaceId();
    if (!workspaceId) return;
    setLoading(true);
    try {
      const d = await api<KnowledgeData>(`/api/admin/metrics/knowledge?workspaceId=${workspaceId}`);
      setData(d);
    } catch {
      toast.error("Failed to load knowledge data");
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No knowledge data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.totalFiles} files, {formatFileSize(data.totalBytes)} total storage
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
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-muted-foreground">Total Files</span>
            </div>
            <p className="text-2xl font-bold">{data.totalFiles}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-cyan-500" />
              <span className="text-xs text-muted-foreground">Total Storage</span>
            </div>
            <p className="text-2xl font-bold">{formatFileSize(data.totalBytes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">File Statuses</span>
            </div>
            <p className="text-2xl font-bold">{data.byStatus.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Files by Status</CardTitle>
          <CardDescription>Indexing status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.byStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      s.status === "ready" ? "bg-green-500" : "bg-amber-500"
                    )}
                  />
                  <span className="text-sm capitalize">{s.status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{s.count} files</span>
                  <span className="text-sm text-muted-foreground">{formatFileSize(s.bytes)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
          <CardDescription>Last 10 uploaded knowledge files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="text-left py-2 font-medium">File</th>
                  <th className="text-left py-2 font-medium">Type</th>
                  <th className="text-right py-2 font-medium">Size</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {data.recentFiles.map((f) => (
                  <tr key={f.id} className="border-b border-border/10">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{f.name}</span>
                      </div>
                    </td>
                    <td className="py-2 text-muted-foreground">{f.fileType}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {formatFileSize(f.fileSize)}
                    </td>
                    <td className="py-2">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          STATUS_COLORS[f.status] || "bg-muted/20 text-muted-foreground"
                        )}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.recentFiles.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">No files found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
