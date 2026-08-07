"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/suite/PageHeader";
import { KnowledgeCard } from "./KnowledgeCard";
import { KnowledgeLinkModal } from "./KnowledgeLinkModal";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Files,
  Upload,
  Loader2,
  Search,
  X,
  Filter,
  FileCheck,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api-client";

export interface KnowledgeFileItem {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  error: string | null;
  chunkCount?: number;
  linkedChatCount?: number;
  createdAt: string;
}

type StatusFilter = "all" | "ready" | "pending" | "failed";
type TypeFilter = "all" | "document" | "code" | "data";

export function KnowledgeLibraryPage({ projectId }: { projectId?: string }) {
  const [files, setFiles] = useState<KnowledgeFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [linkingFile, setLinkingFile] = useState<KnowledgeFileItem | null>(null);

  const fetchFiles = useCallback(() => {
    let cancelled = false;
    api<{ files: KnowledgeFileItem[] }>(`/api/knowledge${projectId ? `?projectId=${projectId}` : ""}`)
      .then((data) => {
        if (cancelled) return;
        setFiles(
          (data.files ?? []).map((f) => ({
            ...f,
            chunkCount: (f as unknown as { _count?: { chunks?: number } })._count?.chunks ?? 0,
            linkedChatCount: (f as unknown as { _count?: { messageLinks?: number } })._count?.messageLinks ?? 0,
          }))
        );
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds maximum file size limit (25MB)`);
        return;
      }

      setUploading(true);
      const form = new FormData();
      form.append("file", file);
      if (projectId) form.append("projectId", projectId);

      try {
        const created = await api<KnowledgeFileItem>("/api/knowledge", {
          method: "POST",
          body: form,
        });
        setFiles((prev) => [created, ...prev]);
        toast.success(`Indexed "${file.name}"`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Failed to upload "${file.name}"`);
      } finally {
        setUploading(false);
      }
    },
    [projectId]
  );

  const handleFiles = useCallback(
    (list: FileList | File[]) => {
      for (const f of Array.from(list)) uploadFile(f);
    },
    [uploadFile]
  );

  const removeFile = useCallback(async (id: string) => {
    try {
      await api(`/api/knowledge/${id}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success("Document removed from knowledge base");
    } catch {
      toast.error("Failed to delete document");
    }
  }, []);

  // Filtering
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      // Search text
      if (search) {
        const q = search.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(q) || f.fileName.toLowerCase().includes(q);
        if (!matchesName) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "ready" && f.status !== "ready" && f.status !== "indexed") return false;
        if (statusFilter === "pending" && f.status !== "pending" && f.status !== "indexing" && f.status !== "queued") return false;
        if (statusFilter === "failed" && f.status !== "failed" && f.status !== "error") return false;
      }

      // Type filter
      if (typeFilter !== "all") {
        const ext = f.fileName.split(".").pop()?.toLowerCase() ?? "";
        if (typeFilter === "document" && !["pdf", "md", "markdown", "txt", "doc", "docx"].includes(ext)) return false;
        if (typeFilter === "code" && !["js", "ts", "tsx", "jsx", "py", "css", "html"].includes(ext)) return false;
        if (typeFilter === "data" && !["json", "csv", "xlsx", "xml"].includes(ext)) return false;
      }

      return true;
    });
  }, [files, search, statusFilter, typeFilter]);

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 scrollbar-thin">
      {/* Page Header */}
      <PageHeader
        title="Knowledge Base"
        description="Manage reference documents that can be attached to conversations."
        icon={<Files className="w-5 h-5" />}
        variant="with-action"
        actions={
          <Button
            size="sm"
            onClick={() => document.getElementById("knowledge-file-input")?.click()}
            className="gap-2 focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Upload document"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </Button>
        }
      />

      {/* Hidden file input */}
      <input
        type="file"
        id="knowledge-file-input"
        multiple
        accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.css,.js,.ts,.tsx,.jsx,.py,.pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 sm:p-8 mb-6 text-center transition-all duration-200",
          dragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border/40 hover:border-border/80 bg-card/50"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center justify-center py-4" role="status" aria-label="Indexing document">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">Indexing document...</p>
            <p className="text-xs text-muted-foreground mt-1">Chunking and parsing for fast vector search</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => document.getElementById("knowledge-file-input")?.click()}
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg p-2"
            aria-label="Drag and drop or browse files to upload"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60 group-hover:text-primary transition-colors" />
            <p className="text-sm font-medium text-foreground">
              Drop files here or <span className="text-primary font-semibold underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports TXT, MD, PDF, CSV, JSON, HTML, Code — up to 25MB per file
            </p>
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search knowledge..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all"
            aria-label="Search knowledge base"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/20 text-xs">
            <Filter className="w-3 h-3 text-muted-foreground ml-1 mr-0.5" />
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-2 py-1 rounded-md transition-all font-medium",
                statusFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("ready")}
              className={cn(
                "px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1",
                statusFilter === "ready" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileCheck className="w-3 h-3 text-emerald-500" /> Ready
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={cn(
                "px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1",
                statusFilter === "pending" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="w-3 h-3 text-amber-500" /> Pending
            </button>
            <button
              onClick={() => setStatusFilter("failed")}
              className={cn(
                "px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1",
                statusFilter === "failed" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <AlertTriangle className="w-3 h-3 text-rose-500" /> Error
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/20 text-xs">
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "px-2 py-1 rounded-md transition-all font-medium",
                typeFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter("document")}
              className={cn(
                "px-2 py-1 rounded-md transition-all font-medium",
                typeFilter === "document" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Docs
            </button>
            <button
              onClick={() => setTypeFilter("code")}
              className={cn(
                "px-2 py-1 rounded-md transition-all font-medium",
                typeFilter === "code" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Code
            </button>
            <button
              onClick={() => setTypeFilter("data")}
              className={cn(
                "px-2 py-1 rounded-md transition-all font-medium",
                typeFilter === "data" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Data
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20" role="status" aria-label="Loading knowledge base">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Loading documents...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        files.length === 0 ? (
          <EmptyState
            icon={Files}
            title="No reference documents yet"
            description="Upload documents to ground AI responses with citations and precise context."
            action={
              <Button size="sm" onClick={() => document.getElementById("knowledge-file-input")?.click()}>
                Upload a document
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No matching documents"
            description="Try adjusting your search query or status filter."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
              >
                Reset filters
              </Button>
            }
          />
        )
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredFiles.map((file) => (
              <KnowledgeCard
                key={file.id}
                file={file}
                onDelete={removeFile}
                onLink={(f) => setLinkingFile(f)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Knowledge Link Modal */}
      <KnowledgeLinkModal
        file={linkingFile}
        onClose={() => setLinkingFile(null)}
        onSuccess={fetchFiles}
      />
    </div>
  );
}
