"use client";
import { useState, useCallback } from "react";
import { useDeleteVersion, useRestoreVersion, useVersionHistory } from "@/hooks/use-version-history";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RotateCcw, GitCompare, Trash2, Download } from "lucide-react";

interface VersionHistoryProps {
  resourceType: string;
  resourceId: string;
  onRestore?: (content: Record<string, unknown>) => void;
  onCompare?: (baseId: string, targetId: string) => void;
  maxHeight?: string;
}

export function VersionHistory({ resourceType, resourceId, onRestore, onCompare, maxHeight = "400px" }: VersionHistoryProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data, isLoading, error } = useVersionHistory(resourceType, resourceId);
  const restore = useRestoreVersion();
  const remove = useDeleteVersion();

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRestore = useCallback(async (id: string) => {
    const result = await restore.mutate(id);
    if (result && onRestore) {
      onRestore(result.content);
    }
  }, [onRestore, restore]);

  const handleCompare = useCallback(() => {
    if (selectedIds.size === 2 && onCompare) {
      const [baseId, targetId] = Array.from(selectedIds);
      onCompare(baseId, targetId);
    }
  }, [selectedIds, onCompare]);

  const handlePruneAuto = useCallback(async () => {
    if (data?.items) {
      const autoSnapshots = data.items.filter((s) => s.isAuto);
      for (const snap of autoSnapshots.slice(10)) {
        await remove.mutate(snap.id);
      }
    }
  }, [data?.items, remove]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-red-600">
        Failed to load version history: {error.message}
      </div>
    );
  }

  const versions = data?.items ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{versions.length} versions</span>
          {selectedIds.size === 2 && (
            <Button variant="outline" size="sm" onClick={handleCompare}>
              <GitCompare className="h-3.5 w-3.5 mr-1" />
              Compare
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePruneAuto}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Prune Auto Snapshots
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1" style={{ maxHeight }}>
        <div className="flex flex-col gap-2">
          {versions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No versions found</div>
          ) : (
            versions.map((version) => (
              <div key={version.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <input
                  type="checkbox"
                  checked={selectedIds.has(version.id)}
                  onChange={() => handleSelect(version.id)}
                  className="h-4 w-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">v{version.version}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {version.changeType}
                    </span>
                    {version.isAuto && (
                      <Badge variant="secondary" className="text-[10px]">auto</Badge>
                    )}
                  </div>
                  {version.title && (
                    <p className="text-sm font-medium truncate">{version.title}</p>
                  )}
                  {version.changeSummary && (
                    <p className="text-xs text-muted-foreground mt-0.5">{version.changeSummary}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleRestore(version.id)}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}