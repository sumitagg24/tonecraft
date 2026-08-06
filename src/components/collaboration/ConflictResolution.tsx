"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ConflictResolutionProps {
  conflicts: Array<{
    field: string;
    baseValue: unknown;
    incomingValue: unknown;
    currentValue: unknown;
  }>;
  onResolve?: (resolution: "incoming" | "current" | "merge") => void;
}

export function ConflictResolution({ conflicts, onResolve }: ConflictResolutionProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-800">Conflict Detected</span>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          {conflicts.length} field{conflicts.length > 1 ? "s" : ""}
        </Badge>
      </div>
      <div className="space-y-2 mb-3">
        {conflicts.map((conflict) => (
          <div key={conflict.field} className="text-xs space-y-1">
            <p className="font-medium text-amber-700">{conflict.field}</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded p-2">
                <p className="text-[10px] text-muted-foreground">Base</p>
                <p className="text-xs">{String(conflict.baseValue)}</p>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <p className="text-[10px] text-blue-600">Incoming</p>
                <p className="text-xs">{String(conflict.incomingValue)}</p>
              </div>
              <div className="bg-green-50 rounded p-2">
                <p className="text-[10px] text-green-600">Current</p>
                <p className="text-xs">{String(conflict.currentValue)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onResolve?.("incoming")}>
          Use Incoming
        </Button>
        <Button variant="outline" size="sm" onClick={() => onResolve?.("current")}>
          Keep Current
        </Button>
        <Button variant="default" size="sm" onClick={() => onResolve?.("merge")}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Merge
        </Button>
      </div>
    </div>
  );
}