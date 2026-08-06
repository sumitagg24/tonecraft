"use client";
import { useWorkspaceActivities, type Activity as WorkspaceActivity } from "@/hooks/workspace/useWorkspace";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { Loader2, Activity } from "lucide-react";

interface ActivityFeedProps {
  workspaceId: string;
}

export function ActivityFeedComponent({ workspaceId }: ActivityFeedProps) {
  const { activities, loading, hasMore, loadMore } = useWorkspaceActivities(workspaceId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <Avatar className="w-8 h-8 mt-0.5">
            <AvatarImage src={activity.user?.image ?? undefined} alt={activity.user?.name ?? "System"} />
            <AvatarFallback>{activity.user?.name?.[0] ?? "S"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{activity.user?.name ?? "System"}</span>
              <span className="text-xs text-gray-500">
                {timeAgo(activity.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">
              {formatActivityMessage(activity)}
            </p>
          </div>
        </div>
      ))}
      {hasMore && (
        <Button onClick={loadMore} variant="ghost" size="sm" className="w-full">
          Load More
        </Button>
      )}
    </div>
  );
}

function formatActivityMessage(activity: WorkspaceActivity): string {
  const payload = activity.payload || {};
  switch (activity.type) {
    case "members_invite":
      return `${payload.action === "invite_sent" ? "Invited" : payload.action === "invite_accepted" ? "Accepted invitation for" : payload.action === "invite_declined" ? "Declined invitation for" : "Updated invitation for"} ${payload.email || payload.memberId}`;
    case "members_remove":
      return `Removed ${payload.memberId} from workspace`;
    case "project_create":
      return `Created workspace ${payload.workspaceName || payload.workspaceId}`;
    case "project_update":
      return `Updated workspace settings`;
    case "project_delete":
      return `Deleted workspace`;
    case "members_status":
      if (payload.action === "added") return `Added member ${payload.memberId} with role ${payload.role}`;
      if (payload.action === "role_updated") return `Updated role for ${payload.memberId} to ${payload.role}`;
      if (payload.action === "removed") return `Removed member ${payload.memberId}`;
      return `Updated member status`;
    default:
      return "Activity occurred";
  }
}