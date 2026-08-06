"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Split } from "lucide-react";
import type { VersionSnapshot } from "@/services/VersionHistoryService";

interface VersionDiffViewerProps {
  baseVersion: VersionSnapshot;
  targetVersion: VersionSnapshot;
}

export function VersionDiffViewer({ baseVersion, targetVersion }: VersionDiffViewerProps) {
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");

  const diff = useMemo(() => {
    const base = (baseVersion.content ?? {}) as Record<string, unknown>;
    const target = (targetVersion.content ?? {}) as Record<string, unknown>;
    const baseKeys = new Set(Object.keys(base));
    const targetKeys = new Set(Object.keys(target));
    const allKeys = new Set([...baseKeys, ...targetKeys]);

    const changes: Array<{ key: string; base: unknown; target: unknown; type: "added" | "removed" | "changed" }> = [];
    allKeys.forEach((key) => {
      const baseVal = base[key];
      const targetVal = target[key];
      if (!baseKeys.has(key)) {
        changes.push({ key, base: undefined, target: targetVal, type: "added" });
      } else if (!targetKeys.has(key)) {
        changes.push({ key, base: baseVal, target: undefined, type: "removed" });
      } else if (JSON.stringify(baseVal) !== JSON.stringify(targetVal)) {
        changes.push({ key, base: baseVal, target: targetVal, type: "changed" });
      }
    });
    return changes;
  }, [baseVersion.content, targetVersion.content]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline">v{baseVersion.version}</Badge>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        <Badge variant="outline">v{targetVersion.version}</Badge>
        <span className="text-xs text-muted-foreground ml-2">
          {diff.length} change{diff.length !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setViewMode("split")}>
            <Split className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {viewMode === "split" ? (
          <div className="grid grid-cols-2 gap-px bg-border">
            <div className="bg-background p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Base (v{baseVersion.version})</h4>
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(baseVersion.content, null, 2)}</pre>
            </div>
            <div className="bg-background p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Target (v{targetVersion.version})</h4>
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(targetVersion.content, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <div className="bg-background p-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Unified Diff</h4>
            <div className="space-y-1">
              {diff.map((change) => (
                <div key={change.key} className={`text-xs p-2 rounded ${change.type === "added" ? "bg-green-50" : change.type === "removed" ? "bg-red-50" : "bg-yellow-50"}`}>
                  <span className="font-mono font-medium">{change.key}</span>
                  {change.type === "added" && (
                    <span className="text-green-600 ml-2">+ {JSON.stringify(change.target)}</span>
                  )}
                  {change.type === "removed" && (
                    <span className="text-red-600 ml-2">- {JSON.stringify(change.base)}</span>
                  )}
                  {change.type === "changed" && (
                    <span className="text-yellow-700 ml-2">
                      - {JSON.stringify(change.base)} → + {JSON.stringify(change.target)}
                    </span>
                  )}
                </div>
              ))}
              {diff.length === 0 && (
                <p className="text-xs text-muted-foreground">No differences found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}