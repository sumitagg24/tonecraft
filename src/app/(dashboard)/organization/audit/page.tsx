"use client";
import { useState, useEffect, useCallback } from "react";
import { FileText, RefreshCw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface OrgSummary { id: string; name: string; }

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  targetId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; name: string | null; email: string | null; image: string | null } | null;
}

interface AuditResponse {
  items: AuditEntry[];
  total: number;
  page: number;
  perPage: number;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function OrgAuditPage() {
  const [orgId, setOrgId] = useState("");
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [data, setData] = useState<AuditResponse>({ items: [], total: 0, page: 1, perPage: 50 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrgs = useCallback(async () => {
    try {
      const list = await api<OrgSummary[]>("/api/organizations");
      setOrgs(list);
      if (list.length > 0) setOrgId((prev) => (prev && list.some((o) => o.id === prev) ? prev : list[0].id));
    } catch {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const fetchLogs = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const d = await api<AuditResponse>(`/api/organizations/${orgId}/audit?perPage=50`);
      setData(d);
    } catch {
      toast.error("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = searchTerm
    ? data.items.filter((i) =>
        [i.action, i.resource, i.actor?.name, i.actor?.email, i.ip]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : data.items;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Org-wide: who changed what, when, and from where</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm"
            aria-label="Select organization"
          >
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events ({data.total})</CardTitle>
          <CardDescription>Every org-level action with actor, IP, and user-agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by action, actor, or IP…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted/10 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No audit events yet.</p>
          ) : (
            <ul className="divide-y divide-border/20">
              {filtered.map((e) => (
                <li key={e.id} className="py-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <code className="text-xs bg-muted/40 px-1.5 py-0.5 rounded shrink-0">{e.action}</code>
                      <span className="text-xs text-muted-foreground truncate">
                        {e.actor?.name ?? e.actor?.email ?? "System"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatTime(e.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{e.resource}</Badge>
                    {e.resourceId && <code className="text-[10px] text-muted-foreground">{e.resourceId.slice(0, 10)}…</code>}
                    {e.ip && <span className="text-[10px] text-muted-foreground">IP {e.ip}</span>}
                    {e.targetId && <span className="text-[10px] text-muted-foreground">target {e.targetId.slice(0, 10)}…</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
