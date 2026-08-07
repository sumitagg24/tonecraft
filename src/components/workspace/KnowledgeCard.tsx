"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  File,
  Trash2,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import type { KnowledgeFileItem } from "./KnowledgeLibraryPage";

interface KnowledgeCardProps {
  file: KnowledgeFileItem;
  onDelete: (id: string) => void;
  onLink?: (file: KnowledgeFileItem) => void;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

function getFileIcon(fileName: string, _fileType?: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["js", "ts", "tsx", "jsx", "json", "html", "css", "py"].includes(ext)) {
    return <FileCode className="w-4 h-4 text-amber-500" />;
  }
  if (["csv", "xlsx", "xls"].includes(ext)) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
  }
  if (["pdf"].includes(ext)) {
    return <FileCheck className="w-4 h-4 text-rose-500" />;
  }
  if (["md", "markdown", "txt"].includes(ext)) {
    return <FileText className="w-4 h-4 text-sky-500" />;
  }
  return <File className="w-4 h-4 text-brand" />;
}

export function KnowledgeCard({ file, onDelete, onLink }: KnowledgeCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(file.id);
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const isPending = file.status === "pending" || file.status === "indexing" || file.status === "queued";
  const isIndexed = file.status === "ready" || file.status === "indexed";
  const isError = file.status === "failed" || file.status === "error";
  const linkedCount = file.linkedChatCount ?? (file as unknown as { _count?: { messageLinks?: number } })._count?.messageLinks ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        "group relative flex flex-col justify-between p-4 min-h-[80px]",
        "rounded-xl border border-border/40 bg-card text-card-foreground shadow-sm transition-all duration-100",
        "hover:shadow-md hover:border-border/80 focus-within:ring-2 focus-within:ring-primary/30"
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {/* Type-specific File Icon */}
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-border/30",
            isPending ? "bg-amber-500/10" : isError ? "bg-rose-500/10" : "bg-primary/10"
          )}
          aria-hidden="true"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          ) : (
            getFileIcon(file.fileName || file.name, file.fileType)
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h5
            className="text-base font-medium text-foreground truncate tracking-tight"
            title={file.name}
            aria-label={`File: ${file.name}`}
          >
            {file.name}
          </h5>

          <p className="text-xs text-muted-foreground/80 truncate mt-1 flex items-center gap-1.5">
            <span>{formatBytes(file.fileSize)}</span>
            {file.createdAt && <span>• {formatDate(file.createdAt)}</span>}
          </p>

          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {/* Status Badge */}
            {isPending && (
              <Badge
                variant="outline"
                className="text-xs font-normal border-amber-500/30 text-amber-500 bg-amber-500/10 gap-1"
                aria-label="Status: Indexing"
              >
                <Loader2 className="w-3 h-3 animate-spin" /> Indexing...
              </Badge>
            )}

            {isIndexed && (
              <Badge
                variant="outline"
                className="text-xs font-normal border-emerald-500/30 text-emerald-500 bg-emerald-500/10 gap-1"
                aria-label="Status: Ready"
              >
                <CheckCircle2 className="w-3 h-3" /> Ready
              </Badge>
            )}

            {isError && (
              <Badge
                variant="outline"
                className="text-xs font-normal border-rose-500/30 text-rose-500 bg-rose-500/10 gap-1"
                aria-label="Status: Processing failed"
              >
                <AlertCircle className="w-3 h-3" /> Processing failed
              </Badge>
            )}

            {/* Linked Badge */}
            {linkedCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs font-normal border-sky-500/30 text-sky-500 bg-sky-500/10 gap-1"
                aria-label={`Linked to ${linkedCount} chats`}
              >
                <MessageSquare className="w-3 h-3" /> {linkedCount} {linkedCount === 1 ? "chat" : "chats"}
              </Badge>
            )}
          </div>

          {file.error && (
            <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" /> {file.error}
            </p>
          )}
        </div>
      </div>

      {/* Card Actions (Hover on Desktop, Always Visible on Mobile) */}
      <div
        className={cn(
          "flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-border/10 transition-opacity duration-100",
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100"
        )}
      >
        {onLink && isIndexed && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={() => onLink(file)}
            aria-label="Link to conversation"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Link</span>
          </Button>
        )}

        <Button
          variant={isConfirmingDelete ? "destructive" : "ghost"}
          size="sm"
          disabled={isDeleting}
          className={cn(
            "h-7 text-xs gap-1.5 focus-visible:ring-2 focus-visible:ring-primary/30",
            isConfirmingDelete ? "px-2 bg-destructive text-destructive-foreground" : "text-muted-foreground hover:text-destructive"
          )}
          onClick={handleDelete}
          aria-label={isConfirmingDelete ? "Confirm deletion of " + file.name : "Delete " + file.name}
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          <span>{isConfirmingDelete ? "Confirm" : "Delete"}</span>
        </Button>

        {isConfirmingDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => setIsConfirmingDelete(false)}
          >
            Cancel
          </Button>
        )}
      </div>
    </motion.div>
  );
}
