"use client";
import { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw, Users, Crown, UserCheck, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";

interface PermissionData {
  total: number;
  roleDistribution: Record<string, number>;
  members: Array<{
    id: string;
    role: string;
    createdAt: string;
    user: { id: string; name: string | null; email: string | null; image: string | null; createdAt: string };
  }>;
  invites: Array<{
    id: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string | null;
    createdAt: string;
    sentBy: { id: string; name: string | null; email: string | null } | null;
  }>;
  recentAudit: Array<{
    id: string;
    action: string;
    resource: string;
    actorId: string | null;
    targetId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }>;
}

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Crown,
  manager: UserCheck,
  member: User,
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

export default function AdminPermissionsPage() {
  const [data, setData] = useState<PermissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchWorkspaceId = useCallback(async (): Promise<string | null> => {
    const workspaces = await api<any[]>("/api/workspaces");
    return workspaces?.[0]?.id ?? null;
  }, []);

  const fetchData = useCallback(async () => {
    const workspaceId = await fetchWorkspaceId();
    if (!workspaceId) return;
    setLoading(true);
    try {
      const d = await api<PermissionData>(`/api/admin/permissions?workspaceId=${workspaceId}`);
      setData(d);
    } catch {
      toast.error("Failed to load permissions data");
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChangeRole = useCallback(async (userId: string, role: string) => {
    const workspaceId = (await fetchWorkspaceId());
    if (!workspaceId) return;
    setUpdating(userId);
    try {
      await api(`/api/admin/permissions?workspaceId=${workspaceId}&targetUserId=${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      toast.success(`Role updated to ${ROLE_LABELS[role] || role}`);
      fetchData();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to update role");
    } finally {
      setUpdating(null);
    }
  }, [fetchWorkspaceId, fetchData]);

  const handleRemoveMember = useCallback(async (userId: string) => {
    const workspaceId = (await fetchWorkspaceId());
    if (!workspaceId) return;
    if (!confirm("Remove this member from the workspace?")) return;
    setUpdating(userId);
    try {
      await api(`/api/admin/permissions?workspaceId=${workspaceId}&targetUserId=${userId}`, {
        method: "DELETE",
      });
      toast.success("Member removed");
      fetchData();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to remove member");
    } finally {
      setUpdating(null);
    }
  }, [fetchWorkspaceId, fetchData]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No permissions data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Permissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.total} members with {Object.keys(data.roleDistribution).length} roles
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(data.roleDistribution).map(([role, count]) => {
          const Icon = ROLE_ICONS[role] || User;
          return (
            <Card key={role}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs text-muted-foreground">{ROLE_LABELS[role] || role}</span>
                </div>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Members</CardTitle>
          <CardDescription>Manage member roles and access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="text-left py-2 font-medium">Member</th>
                  <th className="text-left py-2 font-medium">Role</th>
                  <th className="text-left py-2 font-medium">Joined</th>
                  <th className="text-right py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((m) => {
                  const Icon = ROLE_ICONS[m.role] || User;
                  return (
                    <tr key={m.id} className="border-b border-border/10">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium">{m.user?.name ?? "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{m.user?.email ?? "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2">
                        <Badge
                          variant={m.role === "admin" ? "default" : m.role === "manager" ? "secondary" : "outline"}
                          className="capitalize"
                        >
                          {m.role}
                        </Badge>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={updating === m.user?.id}
                            onClick={() => handleChangeRole(m.user?.id ?? "", "manager")}
                          >
                            Promote
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={updating === m.user?.id}
                            className="text-destructive"
                            onClick={() => handleRemoveMember(m.user?.id ?? "")}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data.invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>{data.invites.length} pending invites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between py-2 border-b border-border/10">
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Role: {invite.role} · Invited by {invite.sentBy?.name || invite.sentBy?.email || "unknown"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {invite.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.recentAudit.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Permission Changes</CardTitle>
            <CardDescription>Latest audit entries for this workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentAudit.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="font-medium">{a.action}</span>
                    <span className="text-muted-foreground"> on </span>
                    <span className="text-muted-foreground">{a.resource}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
