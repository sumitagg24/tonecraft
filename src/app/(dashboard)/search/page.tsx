"use client";
import { useSearch } from "@/hooks/use-search";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, FileText, Loader2, BookOpen, Users, Files } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SearchPage() {
  const { query, setQuery, results, loading } = useSearch();

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Search</h1>
          <p className="text-sm text-muted-foreground mt-1">Search across chats, messages, prompts, personas, and knowledge</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search chats and messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-11 text-base"
            autoFocus
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Searching">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && query && (
          <div className="space-y-8">
            {results.chats.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chats ({results.chats.length})
                </h2>
                <div className="space-y-1">
                  {results.chats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Link
                        href={`/chat/${chat.id}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{chat.title}</p>
                          <p className="text-xs text-muted-foreground">{chat.tone}</p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {results.messages.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Messages ({results.messages.length})
                </h2>
                <div className="space-y-1">
                  {results.messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Link
                        href={`/chat/${msg.chatId}`}
                        className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm line-clamp-2">{msg.content}</p>
                          <p className="text-xs text-muted-foreground mt-1 capitalize">{msg.role}</p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {results.prompts.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Prompts ({results.prompts.length})
                </h2>
                <div className="space-y-1">
                  {results.prompts.map((p) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <Link
                        href="/library"
                        className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {p.category} · {p.description || p.content}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {results.personas.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Personas ({results.personas.length})
                </h2>
                <div className="space-y-1">
                  {results.personas.map((p) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <Link
                        href="/library"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-micro shrink-0"
                          style={{ backgroundColor: `${p.color}22`, color: p.color }}
                        >
                          {p.icon || p.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          {p.description && <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {results.knowledge.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Files className="w-4 h-4" />
                  Knowledge ({results.knowledge.length})
                </h2>
                <div className="space-y-1">
                  {results.knowledge.map((f) => (
                    <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <Link
                        href="/library"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <Files className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{f.fileName}</p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {results.chats.length === 0 && results.messages.length === 0 && results.prompts.length === 0 && results.personas.length === 0 && results.knowledge.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        )}

        {!loading && !query && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground">Type to search across your chats and messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
