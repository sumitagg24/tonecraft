"use client";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api, apiPost } from "@/lib/api-client";

interface FeedbackItem {
  id: string;
  category: "bug" | "feature_request" | "general" | "other";
  rating: number | null;
  message: string;
  page: string | null;
  status: "NEW" | "REVIEWED" | "RESOLVED";
  reviewedAt: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
}

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "general", label: "General Feedback" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "RESOLVED", label: "Resolved" },
];

const CATEGORY_LABEL: Record<string, string> = {
  bug: "Bug",
  feature_request: "Feature Request",
  general: "General",
  other: "Other",
};

const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  REVIEWED: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  RESOLVED: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      const d = await api<{ feedback: FeedbackItem[] }>(
        `/api/admin/feedback${params.toString() ? `?${params}` : ""}`
      );
      setItems(d.feedback);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load feedback");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (id: string, nextStatus: FeedbackItem["status"]) => {
    try {
      await apiPost<FeedbackItem>(`/api/admin/feedback/${id}`, { status: nextStatus });
      toast.success(`Marked ${nextStatus.toLowerCase()}`);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feedback</h1>
          <p className="text-sm text-muted-foreground mt-1">
            User submissions — triage bugs, feature requests, and general feedback.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-lg border border-border/60 bg-background px-3 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-border/60 bg-background px-3 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          {loading ? "Loading…" : `${items.length} result${items.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
            No feedback matches this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 0.2) }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{CATEGORY_LABEL[item.category] ?? item.category}</Badge>
                      <Badge className={STATUS_STYLE[item.status] ?? ""}>{item.status}</Badge>
                      {item.rating ? (
                        <span className="text-xs text-amber-500">{"★".repeat(item.rating)}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        {expandedId === item.id ? "Hide" : "View"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">
                    {item.message}
                  </p>
                  {expandedId === item.id && (
                    <div className="space-y-3 pt-2 border-t border-border/40">
                      <p className="text-sm whitespace-pre-wrap">{item.message}</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>From: {item.user.name ? `${item.user.name} ` : ""}
                          <span className="font-mono">{item.user.email}</span>
                        </p>
                        {item.page ? <p>Page: {item.page}</p> : null}
                        {item.reviewedAt ? (
                          <p>Last updated: {formatDate(item.reviewedAt)}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status !== "REVIEWED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(item.id, "REVIEWED")}
                          >
                            Mark reviewed
                          </Button>
                        )}
                        {item.status !== "RESOLVED" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(item.id, "RESOLVED")}
                          >
                            Mark resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
