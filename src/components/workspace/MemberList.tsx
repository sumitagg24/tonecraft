"use client";
import { useWorkspaceMembers } from "@/hooks/workspace/useWorkspace";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, UserCheck, MoreVertical, Crown, Settings } from "lucide-react";
import { useMemo } from "react";

interface MemberListProps {
  workspaceId: string;
  currentUserId: string;
  currentUserRole: "member" | "manager" | "admin";
}

export function MemberList({ workspaceId, currentUserId, currentUserRole }: MemberListProps) {
  const { members, loading, removeMember, updateMemberRole } = useWorkspaceMembers(workspaceId);
  const presence = useWorkspaceStore((s) => s.presence);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Crown className="w-3 h-3 text-yellow-500" />;
      case "manager": return <Shield className="w-3 h-3 text-blue-500" />;
      default: return <UserCheck className="w-3 h-3 text-gray-400" />;
    }
  };

  const canManageMembers = currentUserRole === "admin" || currentUserRole === "manager";

  const sortedMembers = useMemo(() => {
    const roleOrder: Record<string, number> = { admin: 0, manager: 1, member: 2 };
    return [...members].sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
  }, [members]);

  const handleRoleChange = async (userId: string, newRole: "member" | "manager" | "admin") => {
    try {
      await updateMemberRole(userId, newRole);
    } catch (e) {
      console.error("Failed to update role", e);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeMember(userId);
    } catch (e) {
      console.error("Failed to remove member", e);
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Loading members...</div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm text-gray-500 uppercase">Members ({members.length})</h3>
        {canManageMembers && (
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {sortedMembers.map((member) => {
        const isOnline = presence[member.userId]?.online ?? false;
        return (
          <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <div className="relative">
              <Avatar>
                <AvatarImage src={member.user.image ?? undefined} alt={member.user.name} />
                <AvatarFallback>{member.user.name?.[0] ?? member.user.email[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-0 right-0 block w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-300"}`} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="font-medium">{member.user.name ?? member.user.email}</span>
                {member.userId === currentUserId && <span className="text-xs text-gray-400">(You)</span>}
              </div>
              <div className="flex items-center gap-1">
                {getRoleIcon(member.role)}
                <span className="text-xs text-gray-500 capitalize">{member.role}</span>
              </div>
            </div>
            
            {canManageMembers && member.userId !== currentUserId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleRoleChange(member.userId, "member")}>
                    Make Member
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange(member.userId, "manager")}>
                    Make Manager
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange(member.userId, "admin")}>
                    Make Admin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRemove(member.userId)} className="text-red-600">
                    Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      })}
    </div>
  );
}