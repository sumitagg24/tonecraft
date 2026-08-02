"use client";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Files, Upload, Trash2, FileText, Loader2, Search, CheckCircle2, AlertCircle,
} from "lucide-react";

export interface KnowledgeFileItem {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  error: string | null;
  chunkCount: number;
  createdAt: string;
}

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

export function KnowledgeLibraryPage({ projectId }: { projectId?: string }) {
  const [files, setFiles] = useState<KnowledgeFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/knowledge${projectId ? `?projectId=${projectId}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setFiles((data.files ?? []).map((f: KnowledgeFileItem & { _count?: { chunks: number } }) => ({
          ...f,
          chunkCount: f._count?.chunks ?? 0,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [projectId]);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    if (projectId) form.append("projectId", projectId);
    try {
      const res = await fetch("/api/knowledge", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFiles((prev) => [data, ...prev]);
      toast.success(`Indexed "${file.name}"`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [projectId]);

  const handleFiles = useCallback((list: FileList | File[]) => {
    for (const f of Array.from(list)) uploadFile(f);
  }, [uploadFile]);

  const removeFile = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success("File removed");
    } catch {
      toast.error("Failed to delete file");
    }
  }, []);

  const filtered = files.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.fileName.toLowerCase().includes(q);
  });

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Files className="w-5 h-5 text-primary" />
            Knowledge Base
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload documents to ground AI responses with citations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-48 pl-8 pr-3 py-1.5 text-xs rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Upload dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 mb-5 text-center transition-all",
          dragging ? "border-primary bg-primary/5" : "border-border/40 hover:border-border/60"
        )}
      >
        <input
          type="file"
          id="knowledge-file-input"
          multiple
          accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.css,.js"
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Indexing...
          </div>
        ) : (
          <button onClick={() => document.getElementById("knowledge-file-input")?.click()} className="w-full">
            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm font-medium">Drop files here or <span className="text-primary">browse</span></p>
            <p className="text-[11px] text-muted-foreground/50 mt-1">TXT, MD, CSV, JSON, HTML — up to 25MB</p>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-xs text-muted-foreground/60">
          {files.length === 0 ? "No documents yet. Upload a file to start building your knowledge base." : "No files match your search."}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {filtered.map((f) => (
            <motion.div key={f.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border rounded-xl p-4 flex items-start gap-3 bg-card hover:border-border/50 transition-colors">
              <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{f.name}</p>
                <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{f.fileName} · {formatBytes(f.fileSize)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={f.status} />
                  {f.status === "ready" && (
                    <Badge variant="outline" className="text-[10px]">
                      {f.chunkCount.toLocaleString()} chunks
                    </Badge>
                  )}
                </div>
                {f.error && <p className="text-[11px] text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {f.error}</p>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeFile(f.id)} aria-label="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready") {
    return (
      <Badge variant="secondary" className="text-[10px] gap-1 text-emerald-600">
        <CheckCircle2 className="w-3 h-3" /> Ready
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="secondary" className="text-[10px] gap-1 text-destructive">
        <AlertCircle className="w-3 h-3" /> Failed
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px] gap-1">
      <Loader2 className="w-3 h-3 animate-spin" /> {status}
    </Badge>
  );
}
