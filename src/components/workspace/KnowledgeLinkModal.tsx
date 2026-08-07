"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, Link as LinkIcon, Check } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { KnowledgeFileItem } from "./KnowledgeLibraryPage";

interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export function KnowledgeLinkModal({
  file,
  onClose,
  onSuccess,
}: {
  file: KnowledgeFileItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    api<{ chats: ChatSummary[] }>("/api/chats?limit=20")
      .then((data) => setChats(data.chats ?? []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [file]);

  if (!file) return null;

  const handleLink = async () => {
    if (!selectedChatId) return;
    setLinking(true);
    try {
      await api(`/api/knowledge/${file.id}/link`, {
        method: "POST",
        body: JSON.stringify({ chatId: selectedChatId }),
      });
      toast.success(`Attached "${file.name}" to conversation`);
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      toast.error("Failed to link document to conversation");
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <LinkIcon className="w-5 h-5 text-primary" />
            Attach Document to Conversation
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select a conversation to attach <span className="font-medium text-foreground">&quot;{file.name}&quot;</span> to ground future AI responses.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No active conversations found. Start a chat first to link knowledge.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {chats.map((c) => {
                const isSelected = selectedChatId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChatId(c.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors border ${
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground font-medium"
                        : "border-border/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{c.title || "Untitled Chat"}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={linking}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleLink}
            disabled={!selectedChatId || linking}
            className="gap-1.5"
          >
            {linking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Attach Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
