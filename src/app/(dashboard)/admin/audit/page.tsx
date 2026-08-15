"use client";
import { useState, useCallback } from "react";
import { FileText, RefreshCw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminPageSkeleton } from "@/components/shared/AdminPageSkeleton";
import { useAdminMetrics } from "@/hooks/use-admin-metrics";

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  actorId: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditResponse {
  items: AuditEntry[];
  total: number;
}

export default function AdminAuditPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page] = useState(1);
  const perPage = 50;

  const { data: response, loading, refetch } = useAdminMetrics<AuditResponse>({
    path: useCallback(
      (workspaceId: string) =>
        `/api/admin/audit-logs?workspaceId=${workspaceId}&page=${page}&perPage=${perPage}`,
      [page]
    ),
    errorMessage: "Failed to load audit logs",
  });

  const data = response ?? { items: [], total: 0 };

  const filtered = searchTerm
    ? data.items.filter(
        (a) =>
          a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.resource.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data.items;

  const groupByAction = filtered.reduce(
    (acc: Record<string, AuditEntry[]>, entry) => {
      const key = entry.action;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    },
    {}
  );

  if (loading) {
    return <AdminPageSkeleton count={10} itemClassName="h-12 rounded" />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.total} total events recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search actions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "No matching audit entries" : "No audit events recorded yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupByAction).map(([action, entries]) => (
            <Card key={action}>
              <CardHeader>
                <CardTitle className="text-sm font-mono">
                  <Badge variant="outline" className="font-mono text-xs">
                    {action}
                  </Badge>
                </CardTitle>
                <CardDescription>{entries.length} events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20">
                        <th className="text-left py-2 font-medium">Resource</th>
                        <th className="text-left py-2 font-medium">Actor</th>
                        <th className="text-left py-2 font-medium">Target</th>
                        <th className="text-left py-2 font-medium">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries
                        .slice(0, 5)
                        .map((a) => (
                          <tr key={a.id} className="border-b border-border/10">
                            <td className="py-2 text-muted-foreground">{a.resource}</td>
                            <td className="py-2">{a.actorId?.slice(0, 8) ?? "system"}</td>
                            <td className="py-2 text-muted-foreground">
                              {a.targetId ? a.targetId.slice(0, 8) : "—"}
                            </td>
                            <td className="py-2 text-muted-foreground">
                              {new Date(a.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {entries.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{entries.length - 5} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
