"use client";
import { useState, useEffect, useCallback } from "react";
import { Building2, Users, UsersRound, FolderTree, Plus, Globe, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api, apiPost } from "@/lib/api-client";

interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  ownerId: string;
  dataResidency: string;
  role?: string;
  _count: { members: number; teams: number; workspaces: number };
}

interface OrgDetail extends OrgSummary {
  security: { enforce2fa: boolean; sessionTimeoutMinutes: number } | null;
}

interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  color: string;
  _count: { workspaces: number };
}

const RESIDENCY_LABELS: Record<string, string> = { us: "US", eu: "EU", asia: "Asia" };

export default function OrganizationPage() {
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string; teamId: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", slug: "" });

  const fetchOrgs = useCallback(async () => {
    try {
      const list = await api<OrgSummary[]>("/api/organizations");
      setOrgs(list);
      if (list.length > 0) {
        setSelectedId((prev) => (prev && list.some((o) => o.id === prev) ? prev : list[0].id));
      }
    } catch {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const fetchDetail = useCallback(async () => {
    if (!selectedId) return;
    try {
      const [d, t, w] = await Promise.all([
        api<OrgDetail>(`/api/organizations/${selectedId}`),
        api<TeamRow[]>(`/api/organizations/${selectedId}/teams`),
        api<Array<{ id: string; name: string; teamId: string | null }>>("/api/workspaces"),
      ]);
      setDetail(d);
      setTeams(t);
      setWorkspaces(w);
    } catch {
      toast.error("Failed to load organization details");
    }
  }, [selectedId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleCreate = async () => {
    if (!newOrg.name.trim() || !newOrg.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setCreating(true);
    try {
      await apiPost("/api/organizations", newOrg);
      toast.success("Organization created");
      setShowCreate(false);
      setNewOrg({ name: "", slug: "" });
      fetchOrgs();
    } catch {
      toast.error("Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-56 bg-muted/30 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Create your organization
            </CardTitle>
            <CardDescription>
              Organizations group teams and workspaces under one company — with enterprise SSO, security policies,
              and white-label branding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showCreate ? (
              <>
                <div className="space-y-2">
                  <Input
                    placeholder="Company name"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  />
                  <Input
                    placeholder="Slug (acme)"
                    value={newOrg.slug}
                    onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={creating}>
                  {creating ? "Creating…" : "Create organization"}
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create organization
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Organization
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Company → Teams → Workspaces hierarchy</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm"
            aria-label="Select organization"
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={fetchDetail}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Building2 className="w-4 h-4" /> Plan
            </div>
            <div className="text-xl font-semibold capitalize">{detail?.plan ?? "—"}</div>
            <Badge variant="outline" className="mt-1">
              <Globe className="w-3 h-3 mr-1" />
              {RESIDENCY_LABELS[detail?.dataResidency ?? "us"]}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Users className="w-4 h-4" /> Members
            </div>
            <div className="text-xl font-semibold">{detail?._count?.members ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <UsersRound className="w-4 h-4" /> Teams
            </div>
            <div className="text-xl font-semibold">{detail?._count?.teams ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <FolderTree className="w-4 h-4" /> Workspaces
            </div>
            <div className="text-xl font-semibold">{detail?._count?.workspaces ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>Departments and groups in this organization</CardDescription>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No teams yet — create one in the Teams tab to start organizing workspaces.
              </p>
            ) : (
              <ul className="space-y-2">
                {teams.map((t) => (
                  <li key={t.id} className="flex items-center justify-between rounded-lg border border-border/20 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                      <span className="text-sm font-medium">{t.name}</span>
                      {t.department && (
                        <Badge variant="secondary" className="text-[10px]">{t.department}</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{t._count.workspaces} workspaces</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace assignment</CardTitle>
            <CardDescription>Workspaces can be nested under teams</CardDescription>
          </CardHeader>
          <CardContent>
            {workspaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">No workspaces available to assign.</p>
            ) : (
              <ul className="space-y-2">
                {workspaces.map((w) => (
                  <li key={w.id} className="flex items-center justify-between rounded-lg border border-border/20 px-3 py-2">
                    <span className="text-sm font-medium">{w.name}</span>
                    <Badge variant={w.teamId ? "default" : "outline"}>
                      {teams.find((t) => t.id === w.teamId)?.name ?? "Unassigned"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
