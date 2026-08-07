"use client";
import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Crown, Shield, UserCog, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface OrgSummary { id: string; name: string; }

interface Member {
  id: string;
  role: "owner" | "admin" | "manager" | "member";
  department: string | null;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

const ROLE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  owner: { label: "Owner", icon: Crown, cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  admin: { label: "Admin", icon: Shield, cls: "bg-primary/10 text-primary border-primary/30" },
  manager: { label: "Manager", icon: UserCog, cls: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30" },
  member: { label: "Member", icon: User, cls: "bg-muted/30 text-muted-foreground border-border/40" },
};

export default function OrgMembersPage() {
  const [orgId, setOrgId] = useState("");
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Member["role"]>("member");
  const [department, setDepartment] = useState("");

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

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const fetchMembers = useCallback(async () => {
    if (!orgId) return;
    try {
      const list = await api<Member[]>(`/api/organizations/${orgId}/members`);
      setMembers(list);
    } catch {
      toast.error("Failed to load members");
    }
  }, [orgId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setAdding(true);
    try {
      await api(`/api/organizations/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, department: department || undefined }),
      });
      toast.success("Member added");
      setEmail("");
      setDepartment("");
      fetchMembers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: Member["role"]) => {
    try {
      await api(`/api/organizations/${orgId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      toast.success("Role updated");
      fetchMembers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await api(`/api/organizations/${orgId}/members/${memberId}`, { method: "DELETE" });
      toast.success("Member removed");
      fetchMembers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove member");
    }
  };

  if (loading) {
    return <div className="p-6"><div className="h-8 w-56 bg-muted/30 rounded animate-pulse" /></div>;
  }

  if (orgs.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Create an organization first to manage members.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Organization Members
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Company-wide roles and departments</p>
        </div>
        <select
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm"
          aria-label="Select organization"
        >
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add member</CardTitle>
          <CardDescription>Add by email — the user must already have a ToneCraft account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input placeholder="member@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="sm:max-w-xs" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Member["role"])}
              className="h-10 rounded-lg border border-border/40 bg-background px-3 text-sm"
              aria-label="Role"
            >
              {Object.keys(ROLE_META).map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
            </select>
            <Input placeholder="Department (optional)" value={department} onChange={(e) => setDepartment(e.target.value)} className="sm:max-w-[180px]" />
            <Button onClick={handleAdd} disabled={adding || !email.trim()}>
              <UserPlus className="w-4 h-4 mr-2" />
              {adding ? "Adding…" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/20">
            {members.map((m) => {
              const meta = ROLE_META[m.role];
              return (
                <li key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9">
                      {m.user.image && <AvatarImage src={m.user.image} alt={`${m.user.name ?? "member"} avatar`} />}
                      <AvatarFallback className="text-xs font-semibold">
                        {(m.user.name ?? m.user.email ?? "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{m.user.name ?? "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.user.email}</div>
                    </div>
                    {m.department && <Badge variant="outline" className="hidden sm:inline-flex">{m.department}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", meta.cls)}>
                      <meta.icon className="w-3 h-3" />
                      {meta.label}
                    </span>
                    {m.role !== "owner" && (
                      <>
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value as Member["role"])}
                          className="h-8 rounded-md border border-border/40 bg-background px-2 text-xs"
                          aria-label="Change role"
                        >
                          {["admin", "manager", "member"].map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                        </select>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemove(m.id)}>
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
