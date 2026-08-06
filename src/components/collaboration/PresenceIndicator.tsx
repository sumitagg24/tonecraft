"use client";
import { useCollaboration } from "@/components/collaboration/CollaborationProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PresenceIndicatorProps {
  projectId?: string;
  chatId?: string;
  maxDisplay?: number;
}

export function PresenceIndicator({ projectId, chatId, maxDisplay = 5 }: PresenceIndicatorProps) {
  const { projectPresences, chatPresences } = useCollaboration();

  const presences = chatId
    ? chatPresences.get(chatId) ?? []
    : projectId
    ? projectPresences.get(projectId) ?? []
    : [];

  const activeUsers = presences.filter((p) => p.status === "active").slice(0, maxDisplay);
  const offlineCount = presences.filter((p) => p.status === "offline").length;

  if (activeUsers.length === 0 && offlineCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {activeUsers.map((p) => (
          <TooltipProvider key={p.userId}>
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-7 w-7 border-2 border-background">
                  <AvatarImage src={p.image ?? undefined} />
                  <AvatarFallback>{(p.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{p.name ?? "Unknown"}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      {offlineCount > 0 && (
        <span className="text-xs text-muted-foreground">+{offlineCount} offline</span>
      )}
    </div>
  );
}