"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiPost } from "@/lib/api-client";

const CATEGORIES = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "general", label: "General Feedback" },
  { value: "other", label: "Other" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const pathname = usePathname();
  const [category, setCategory] = useState<CategoryValue>("general");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCategory("general");
    setRating(null);
    setMessage("");
    setSubmitting(false);
  };

  const submit = async () => {
    if (!message.trim()) {
      toast.error("Please write a short message.");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/feedback", {
        category,
        rating,
        message: message.trim(),
        page: pathname ?? null,
      });
      toast.success("Thanks! Your feedback has been sent.");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Share feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve ToneCraft — report a bug, request a feature, or tell
            us what you think.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="feedback-category">Category</Label>
            <select
              id="feedback-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryValue)}
              className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Rating (optional)</Label>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "w-6 h-6 transition-colors",
                      (hoverRating ?? rating ?? 0) >= n
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feedback-message">Message</Label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What happened? What would you like to see?"
              maxLength={10000}
              rows={5}
              className="flex w-full rounded-xl border border-border/60 bg-surface px-4 py-2.5 text-base placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:border-primary/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground/60 text-right">
              {message.length}/10000
            </p>
          </div>

          <Button
            className="w-full"
            onClick={submit}
            disabled={submitting || !message.trim()}
          >
            {submitting ? "Sending…" : "Send feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
