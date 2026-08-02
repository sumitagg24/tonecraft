import { useState, useCallback, useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chat-store";
import type { SearchResult } from "@/types";
import { api } from "@/lib/api-client";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult>({ chats: [], messages: [], prompts: [], personas: [], knowledge: [] });
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string) => {
    abortRef.current?.abort();
    if (!q.trim()) {
      setResults({ chats: [], messages: [], prompts: [], personas: [], knowledge: [] });
      setError(null);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const data = await api<SearchResult>(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
      if (!controller.signal.aborted) {
        setResults(data);
        useChatStore.getState().setSearchResults(data);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Search failed. Please try again.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  return { query, setQuery, results, loading, error, search };
}
