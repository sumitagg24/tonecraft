"use client";
import { useState, useMemo } from "react";
import { useActivity, useActivityAggregation } from "@/hooks/use-activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  project_create: "Project Created",
  project_update: "Project Updated",
  project_delete: "Project Deleted",
  chat_message: "Message Sent",
  member_invite: "Member Invited",
  member_remove: "Member Removed",
  typing: "Typing",
  presence_update: "Presence Update",
  comment: "Comment Added",
  bookmark: "Bookmark Added",
};

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  project_create: "bg-green-100 text-green-800",
  project_update: "bg-blue-100 text-blue-800",
  project_delete: "bg-red-100 text-red-800",
  chat_message: "bg-brand/15 text-brand",
  member_invite: "bg-brand/10 text-brand",
  member_remove: "bg-orange-100 text-orange-800",
  typing: "bg-yellow-100 text-yellow-800",
  presence_update: "bg-gray-100 text-gray-800",
  comment: "bg-teal-100 text-teal-800",
  bookmark: "bg-pink-100 text-pink-800",
};

interface ActivityFeedProps {
  projectId?: string;
  chatId?: string;
  userId?: string;
  showFilters?: boolean;
  maxHeight?: string;
}

export function ActivityFeed({ projectId, chatId, userId, showFilters = true, maxHeight = "400px" }: ActivityFeedProps) {
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useActivity({
    projectId,
    chatId,
    userId,
    type: typeFilter !== "all" ? typeFilter : undefined,
    page,
    perPage,
  });

  const { data: aggData } = useActivityAggregation({ projectId, userId });

  const items = data?.items;
  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const totalPages = data ? Math.ceil((data.total ?? 0) / perPage) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-red-600">
        Failed to load activity: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {aggData && aggData.byType.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {aggData.byType.slice(0, 5).map(({ type, _count }) => (
            <Badge key={type} variant="outline" className="text-[10px]">
              {ACTIVITY_TYPE_LABELS[type] ?? type}: {_count.id}
            </Badge>
          ))}
          <span className="text-[10px] text-muted-foreground">{aggData.total} total</span>
        </div>
      )}

      <ScrollArea className="flex-1" style={{ maxHeight }}>
        <div className="flex flex-col gap-2">
          {filteredItems.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No activities found</div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={ACTIVITY_TYPE_COLORS[item.type] ?? "bg-gray-100 text-gray-800"}>
                      {ACTIVITY_TYPE_LABELS[item.type] ?? item.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}