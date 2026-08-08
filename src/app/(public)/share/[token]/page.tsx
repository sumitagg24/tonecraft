"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Lock, MessageSquare, Share2 } from "lucide-react";
import { api } from "@/lib/api-client";

interface ShareMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ShareData {
  token: string;
  createdAt: string;
  chat: { id: string; title: string; messages: ShareMessage[] } | null;
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<ShareData>(`/api/share/${token}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="min-h-screen bg-background pt-24 md:pt-28">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold">Shared with you</span>
          </div>
          <span className="text-micro text-muted-foreground/50 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Read-only view
          </span>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20" role="status" aria-label="Loading">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : data?.chat ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-xl font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              {data.chat.title || "Shared chat"}
            </h1>
            <div className="space-y-3 mt-6">
              {data.chat.messages.map((m) => (
                <div
                  key={m.id}
                  className={m.role === "user"
                    ? "bg-muted/30 border border-border/30 rounded-xl p-4 ml-auto max-w-[85%]"
                    : "bg-primary/5 border border-primary/10 rounded-xl p-4 mr-auto max-w-[85%]"}
                >
                  <div className="text-micro text-muted-foreground/60 mb-1.5 uppercase tracking-wider">
                    {m.role === "user" ? "You" : "ToneCraft"}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20 text-sm text-muted-foreground">This chat is no longer available.</div>
        )}
      </div>
    </div>
  );
}
