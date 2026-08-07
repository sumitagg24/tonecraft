"use client";
import { useState, useEffect, useCallback } from "react";
import { UsersRound, Plus, Trash2, FolderTree } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface OrgSummary { id: string; name: string; }

interface Team {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  color: string;
  _count: { workspaces: number };
}

interface WorkspaceRow { id: string; name: string; teamId: string | null; }

const TEAM_COLORS = ["#6366F1", "#10b981", "#f97316", "#a855f7", "#3b82f6", "#f43f5e"];

export default function OrgTeamsPage() {
  const [orgId, setOrgId] = useState("");
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", department: "", color: TEAM_COLORS[0] });
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

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

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    try {
      const [t, w] = await Promise.all([
        api<Team[]>(`/api/organizations/${orgId}/teams`),
        api<WorkspaceRow[]>("/api/workspaces"),
      ]);
      setTeams(t);
      setWorkspaces(w);
    } catch {
      toast.error("Failed to load teams");
    }
  }, [orgId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await api(`/api/organizations/${orgId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          department: form.department || undefined,
          color: form.color,
        }),
      });
      toast.success("Team created");
      setShowCreate(false);
      setForm({ name: "", description: "", department: "", color: TEAM_COLORS[0] });
      fetchData();
    } catch {
      toast.error("Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (teamId: string) => {
    try {
      await api(`/api/organizations/${orgId}/teams/${teamId}`, { method: "DELETE" });
      toast.success("Team deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete team");
    }
  };

  const handleAssign = async (workspaceId: string, teamId: string) => {
    setAssigning(workspaceId);
    try {
      await api(`/api/organizations/${orgId}/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: teamId || null }),
      });
      toast.success("Workspace assigned");
      fetchData();
    } catch {
      toast.error("Failed to assign workspace");
    } finally {
      setAssigning(null);
    }
  };

  if (loading) {
    return <div className="p-6"><div className="h-8 w-56 bg-muted/30 rounded animate-pulse" /></div>;
  }

  if (orgs.length === 0) {
    return (
      <div className="p-6">
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">Create an organization first to manage teams.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-primary" />
            Teams
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Departments and groups in your organization</p>
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
          <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
            <Plus className="w-4 h-4 mr-1" /> New Team
          </Button>
        </div>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle>Create team</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input placeholder="Team name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="sm:max-w-xs" />
              <Input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="sm:max-w-[180px]" />
              <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:max-w-xs" />
              <div className="flex items-center gap-1.5">
                {TEAM_COLORS.map((c) => (
                  <button
                    key={c}
                    aria-label={`Color ${c}`}
                    onClick={() => setForm({ ...form, color: c })}
                    className={cn("h-7 w-7 rounded-full border-2 transition-all", form.color === c ? "border-foreground scale-110" : "border-transparent")}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Teams ({teams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teams yet.</p>
          ) : (
            <ul className="space-y-2">
              {teams.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-border/20 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ background: t.color }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {t.description || "No description"}
                      </div>
                    </div>
                    {t.department && <Badge variant="secondary">{t.department}</Badge>}
                    <Badge variant="outline">{t._count.workspaces} workspaces</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="w-4 h-4" /> Assign workspaces to teams
          </CardTitle>
          <CardDescription>Nest a workspace under a team to complete the org hierarchy</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {workspaces.map((w) => (
              <li key={w.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border/20 px-4 py-2.5">
                <span className="text-sm font-medium">{w.name}</span>
                <select
                  value={w.teamId ?? ""}
                  disabled={assigning === w.id}
                  onChange={(e) => handleAssign(w.id, e.target.value)}
                  className="h-8 rounded-md border border-border/40 bg-background px-2 text-xs"
                  aria-label={`Assign ${w.name}`}
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
