"use client";
import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSocket } from "@/hooks/use-socket";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface ProjectMember {
  id: string;
  userId: string;
  role: string;
  user?: { id: string; name?: string | null; email?: string | null; image?: string | null };
}

interface ProjectMemberListProps {
  projectId: string;
  currentUserId: string;
  currentRole: "member" | "manager" | "admin";
}

export function ProjectMemberList({ projectId, currentUserId, currentRole }: ProjectMemberListProps) {
  const { on } = useSocket();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { sidebarOpen, toggleSidebar } = useWorkspaceStore();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/projects/${projectId}/members`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");
        setMembers(data.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMembers();
  }, [projectId]);

  const handleAddMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || "Failed to add member");
      setMembers(prev => [...prev, result.data]);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || "Failed to remove member");
      setMembers(prev => prev.filter(m => m.userId !== userId));
    } catch (e: any) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-4">Loading members...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!members?.length) return <div className="p-4 text-gray-500">No members</div>;

  return (
    <div className="space-y-2">
      {members.map(member => (
        <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
          <Avatar className="w-8 h-8">
            <AvatarImage src={member.user?.image ?? undefined} alt={member.user?.name ?? "Member"} />
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-sm">{member.user?.name || member.user?.email}</p>
            <p className="text-xs text-gray-500">{member.role}</p>
          </div>
          {member.userId !== currentUserId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Make Member</DropdownMenuItem>
                <DropdownMenuItem>Make Manager</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleRemoveMember(member.userId)}
                  className="text-red-600"
                >
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  );
}