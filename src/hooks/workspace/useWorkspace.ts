"use client";
import { useState, useEffect, useCallback } from "react";

interface Workspace {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  visibility: string;
  modes: string[];
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  _count: { projects: number; members: number };
}

interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: "member" | "manager" | "admin";
  createdAt: string;
  user: { id: string; name: string; email: string; image: string | null };
}

interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: "member" | "manager" | "admin";
  expiresAt: string | null;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
  sentBy: { id: string; name: string; email: string } | null;
}

export interface Activity {
  id: string;
  workspaceId: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  user: { id: string; name: string; email: string; image: string | null };
}

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");
      setWorkspaces(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

  const createWorkspace = async (data: Partial<Workspace>) => {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || "Failed to create");
    setWorkspaces(prev => [result.data, ...prev]);
    return result.data;
  };

  return { workspaces, loading, error, refetch: fetchWorkspaces, createWorkspace };
}

export function useWorkspace(workspaceId: string) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");
      setWorkspace(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetchWorkspace(); }, [fetchWorkspace]);

  const updateWorkspace = async (data: Partial<Workspace>) => {
    const res = await fetch(`/api/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || "Failed to update");
    setWorkspace(prev => prev ? { ...prev, ...result.data } : null);
    return result.data;
  };

  const deleteWorkspace = async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || "Failed to delete");
    return result.data;
  };

  return { workspace, loading, error, refetch: fetchWorkspace, updateWorkspace, deleteWorkspace };
}

export function useWorkspaceMembers(workspaceId: string) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");
      setMembers(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const addMember = async (userId: string, role: "member" | "manager" | "admin" = "member") => {
    const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || "Failed to add member");
    setMembers(prev => [...prev, result.data]);
    return result.data;
  };

  const updateMemberRole = async (userId: string, role: "member" | "manager" | "admin") => {
    const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || "Failed to update");
    setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role } : m));
    return result.data;
  };

  const removeMember = async (userId: string) => {
    const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || "Failed to remove");
    setMembers(prev => prev.filter(m => m.userId !== userId));
    return result.data;
  };

  return { members, loading, error, refetch: fetchMembers, addMember, updateMemberRole, removeMember };
}

export function useWorkspaceInvites(workspaceId: string) {
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");
      setInvites(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const createInvite = async (email: string, role: "member" | "manager" | "admin" = "member", expiresAt?: Date, projectIds?: string[]) => {
    const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role, expiresAt: expiresAt?.toISOString(), projectIds }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || "Failed to create invite");
    setInvites(prev => [result.data, ...prev]);
    return result.data;
  };

  const updateInvite = async (token: string, status: "pending" | "accepted" | "rejected" | "expired") => {
    const res = await fetch(`/api/workspaces/${workspaceId}/invites/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || "Failed to update");
    setInvites(prev => prev.map(i => i.id === token ? { ...i, status } : i));
    return result.data;
  };

  const deleteInvite = async (token: string) => {
    const res = await fetch(`/api/workspaces/${workspaceId}/invites/${token}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || "Failed to delete");
    setInvites(prev => prev.filter(i => i.id !== token));
    return result.data;
  };

  return { invites, loading, error, refetch: fetchInvites, createInvite, updateInvite, deleteInvite };
}

export function useWorkspaceActivities(workspaceId: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async (pageNum = 1) => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/activities?page=${pageNum}&perPage=50`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");
      if (pageNum === 1) setActivities(data.data);
      else setActivities(prev => [...prev, ...data.data]);
      setHasMore(data.data.length === 50);
      setPage(pageNum);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetchActivities(1); }, [fetchActivities]);

  const loadMore = () => fetchActivities(page + 1);

  return { activities, loading, error, hasMore, loadMore, refetch: () => fetchActivities(1) };
}