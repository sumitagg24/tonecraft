"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Shield, Crown, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";

interface MemberData {
  total: number;
  roleDistribution: Record<string, number>;
  members: Array<{
    id: string;
    role: string;
    createdAt: string;
    user: { id: string; name: string | null; email: string | null; image: string | null; createdAt: string };
  }>;
}

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Crown,
  manager: Shield,
  member: User,
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

export default function AdminMembersPage() {
  const [data, setData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchWorkspaceId = useCallback(async (): Promise<string | null> => {
    const workspaces = await api<Array<{ id: string }>>("/api/workspaces");
    return workspaces?.[0]?.id ?? null;
  }, []);

  const fetchData = useCallback(async () => {
    const workspaceId = await fetchWorkspaceId();
    if (!workspaceId) return;
    setLoading(true);
    try {
      const d = await api<MemberData>(`/api/admin/metrics/members?workspaceId=${workspaceId}`);
      setData(d);
    } catch {
      toast.error("Failed to load members data");
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = useCallback(async (memberUserId: string, newRole: string) => {
    const workspaceId = (await fetchWorkspaceId());
    if (!workspaceId) return;
    setUpdating(memberUserId);
    try {
      await api(`/api/admin/permissions?workspaceId=${workspaceId}&targetUserId=${memberUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      toast.success(`Role updated to ${newRole}`);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.user.id === memberUserId ? { ...m, role: newRole } : m
          ),
        };
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to update role");
    } finally {
      setUpdating(null);
    }
  }, [fetchWorkspaceId]);

  const handleRemove = useCallback(async (memberUserId: string) => {
    const workspaceId = (await fetchWorkspaceId());
    if (!workspaceId) return;
    if (!confirm("Remove this member from the workspace?")) return;
    setUpdating(memberUserId);
    try {
      await api(`/api/admin/permissions?workspaceId=${workspaceId}&targetUserId=${memberUserId}`, {
        method: "DELETE",
      });
      toast.success("Member removed");
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.filter((m) => m.user.id !== memberUserId),
          total: prev.total - 1,
        };
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to remove member");
    } finally {
      setUpdating(null);
    }
  }, [fetchWorkspaceId]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No members data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.total} members in this workspace
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
                  <Icon className="w-4 h-4 text-primary" />
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
          <CardTitle>All Members</CardTitle>
          <CardDescription>Manage member roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.members.map((m) => {
              const Icon = ROLE_ICONS[m.role] || User;
              return (
                <div key={m.id} className="flex items-center justify-between py-3 border-b border-border/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{m.user?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{m.user?.email ?? "No email"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full capitalize flex items-center gap-1",
                        m.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : m.role === "manager"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-muted/20 text-muted-foreground"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {m.role}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          ⋮
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={updating === m.user?.id}
                          onClick={() => handleRoleChange(m.user?.id ?? "", "manager")}
                        >
                          Promote to Manager
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={updating === m.user?.id}
                          onClick={() => handleRoleChange(m.user?.id ?? "", "admin")}
                        >
                          Promote to Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={updating === m.user?.id}
                          className="text-destructive"
                          onClick={() => handleRemove(m.user?.id ?? "")}
                        >
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
