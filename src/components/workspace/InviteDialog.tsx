"use client";
import { useState } from "react";
import { useWorkspaceInvites } from "@/hooks/workspace/useWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface FormatStatusProps {
  status: "pending" | "accepted" | "rejected" | "expired";
}

function FormatStatus({ status }: FormatStatusProps) {
  const config = {
    pending: { label: "Pending", icon: Clock, color: "text-yellow-600" },
    accepted: { label: "Accepted", icon: CheckCircle, color: "text-green-600" },
    rejected: { label: "Rejected", icon: XCircle, color: "text-red-600" },
    expired: { label: "Expired", icon: Clock, color: "text-gray-600" },
  };

  const Item = config[status].icon;
  return (
    <span className={`flex items-center gap-1 ${config[status].color}`}>
      <Item className="w-3 h-3" />
      {config[status].label}
    </span>
  );
}

interface InviteDialogProps {
  workspaceId: string;
  currentUserRole: "member" | "manager" | "admin";
}

export function InviteDialog({ workspaceId, currentUserRole }: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "manager" | "admin">("member");
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const { createInvite } = useWorkspaceInvites(workspaceId);

  const canInvite = currentUserRole === "admin" || currentUserRole === "manager";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 60 * 1000) : undefined;
      await createInvite(email, role, expiresAt);
      setOpen(false);
      setEmail("");
      setRole("member");
      setExpiresIn(null);
    } catch (e) {
      console.error("Failed to send invite", e);
    }
  };

  const canManageInvites = canInvite;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {canManageInvites && (
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Invite Members
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>Send an invitation to join this workspace.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "member" | "manager" | "admin")}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {canInvite && (
                  <SelectItem value="admin">Admin - Full access & management</SelectItem>
                )}
                {canInvite && (
                  <SelectItem value="manager">Manager - Manage members & projects</SelectItem>
                )}
                <SelectItem value="member">Member - Can view & contribute</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expires">Expires In (minutes, optional)</Label>
            <Input
              id="expires"
              type="number"
              placeholder="1440 (24 hours)"
              value={expiresIn ?? ""}
              onChange={(e) => setExpiresIn(e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function InviteList({ workspaceId }: { workspaceId: string }) {
  const { invites } = useWorkspaceInvites(workspaceId);

  return (
    <div className="space-y-2">
      {invites.map((invite) => (
        <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <p className="font-medium">{invite.email}</p>
            <p className="text-xs text-gray-500">
              Role: {invite.role} • Sent: {timeAgo(invite.createdAt)}
            </p>
            {invite.expiresAt && (
              <p className="text-xs text-gray-500">
                Expires: {timeAgo(invite.expiresAt)}
              </p>
            )}
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            invite.status === "pending" ? "bg-yellow-100 text-yellow-800" :
            invite.status === "accepted" ? "bg-green-100 text-green-800" :
            invite.status === "expired" ? "bg-gray-100 text-gray-800" :
            "bg-red-100 text-red-800"
          }`}>
            <FormatStatus status={invite.status} />
          </span>
        </div>
      ))}
      {invites.length === 0 && (
        <p className="text-center text-gray-500 py-4">No invitations sent yet.</p>
      )}
    </div>
  );
}