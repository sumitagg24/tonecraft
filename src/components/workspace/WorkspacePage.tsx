"use client";
import { useState } from "react";
import { InviteDialog, InviteList } from "./InviteDialog";
import { MemberList } from "./MemberList";
import { ActivityFeedComponent } from "./ActivityFeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Settings, Share2, Archive, Pencil } from "lucide-react";
import { useWorkspace } from "@/hooks/workspace/useWorkspace";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface WorkspacePageProps {
  workspaceId: string;
  currentUserId: string;
}

export function WorkspacePageComponent({ workspaceId, currentUserId }: WorkspacePageProps) {
  const { workspace, updateWorkspace, deleteWorkspace } = useWorkspace(workspaceId);
  const [isEditing, setIsEditing] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  if (!workspace) {
    return <div className="p-6">Loading workspace...</div>;
  }

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this workspace? This cannot be undone.")) {
      try {
        await deleteWorkspace();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4 bg-background">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {isEditing ? (
              <Input
                defaultValue={workspace?.name || ""}
                onBlur={(e) => {
                  setIsEditing(false);
                  updateWorkspace({ name: e.target.value });
                }}
                autoFocus
              />
            ) : (
              <h1 className="text-2xl font-bold" onDoubleClick={() => setIsEditing(true)}>
                {workspace?.name || "Workspace"}
              </h1>
            )}
            <p className="text-sm text-muted-foreground">
              {workspace?.description || "No description"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workspace Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Visibility</p>
                    <p className="font-medium">{workspace?.visibility}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mode</p>
                    <p className="font-medium">{workspace?.modes?.join(", ") || "Default"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Count</p>
                    <p className="font-medium">{workspace?._count?.members ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeedComponent workspaceId={workspaceId} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Workspace Members</h2>
              <InviteDialog workspaceId={workspaceId} currentUserRole={currentUserId ? "admin" : "member"} />
            </div>
            <MemberList
              workspaceId={workspaceId}
              currentUserId={currentUserId}
              currentUserRole="admin"
            />
            <InvitationSection workspaceId={workspaceId} />
          </div>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 overflow-y-auto p-6">
          <ActivityFeedComponent workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InvitationSection({ workspaceId }: { workspaceId: string }) {
  const { invites } = useWorkspaceInvites(workspaceId);
  const pendingInvites = invites.filter((i) => i.status === "pending");

  if (pendingInvites.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations ({pendingInvites.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <InviteList workspaceId={workspaceId} />
      </CardContent>
    </Card>
  );
}

import { useWorkspaceInvites } from "@/hooks/workspace/useWorkspace";