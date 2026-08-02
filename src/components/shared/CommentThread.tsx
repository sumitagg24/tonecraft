import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface Comment {
  id: string;
  userId: string;
  messageId: string | null;
  chatId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface CommentThreadProps {
  messageId?: string;
  chatId?: string;
  comments?: Comment[];
}

export function CommentThread({ messageId, chatId, comments: initialComments }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments ?? []);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    const params = new URLSearchParams();
    if (messageId) params.set("messageId", messageId);
    if (chatId) params.set("chatId", chatId);
    try {
      const data = await api<{ comments: Comment[] }>(`/api/comments?${params.toString()}`);
      setComments(data.comments);
    } catch {
      // silently ignore — comments are supplementary
    }
  }, [messageId, chatId]);

  const handleAdd = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      await api("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          chatId,
          content: input.trim(),
        }),
      });
      setInput("");
      await fetchComments();
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
  }, [input, messageId, chatId, fetchComments]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api(`/api/comments?id=${id}`, { method: "DELETE" });
      await fetchComments();
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  }, [fetchComments]);

  const handleEdit = useCallback(async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await api("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, content: editContent.trim() }),
      });
      setEditingId(null);
      await fetchComments();
      toast.success("Comment updated");
    } catch {
      toast.error("Failed to update comment");
    }
  }, [editContent, fetchComments]);

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MessageSquare className="w-3 h-3" />
        <span>{comments.length} comment{comments.length !== 1 ? "s" : ""}</span>
      </div>

      <AnimatePresence>
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/10"
          >
            {editingId === comment.id ? (
              <>
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="h-7 text-xs flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit(comment.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(comment.id)}>
                  <Check className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">{comment.user.name ?? "Unknown"}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{comment.content}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                    className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a comment..."
          className="h-8 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button size="sm" className="h-8 w-8 p-0" onClick={handleAdd} disabled={loading || !input.trim()}>
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}