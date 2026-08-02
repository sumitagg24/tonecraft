"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api-client";

const DEBOUNCE_MS = 800;
const STORAGE_KEY = "tonecraft-draft";

interface DraftSnapshot {
  chatId: string | null;
  content: string;
  tone: string | null;
  personaId: string | null;
  platform: string | null;
  language: string | null;
  updatedAt: string;
}

export function useDraft(chatId: string | null) {
  const [content, setContent] = useState("");
  const [tone, setTone] = useState<string | null>(null);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [conflict, setConflict] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snapshotKey = chatId ? `draft:${chatId}` : "draft:scratch";

  const loadLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}:${snapshotKey}`);
      if (raw) {
        const snapshot: DraftSnapshot = JSON.parse(raw);
        setContent(snapshot.content);
        setTone(snapshot.tone);
        setPersonaId(snapshot.personaId);
        setPlatform(snapshot.platform);
        setLanguage(snapshot.language);
        setHasLocalDraft(true);
      }
    } catch {
      // ignore parse errors
    }
  }, [snapshotKey]);

  const saveLocal = useCallback(() => {
    try {
      const snapshot: DraftSnapshot = {
        chatId,
        content,
        tone,
        personaId,
        platform,
        language,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_KEY}:${snapshotKey}`, JSON.stringify(snapshot));
    } catch {
      // storage full or unavailable
    }
  }, [snapshotKey, chatId, content, tone, personaId, platform, language]);

  const debouncedSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveLocal, DEBOUNCE_MS);
  }, [saveLocal]);

  useEffect(() => {
    const timer = setTimeout(loadLocal, 0);
    return () => clearTimeout(timer);
  }, [loadLocal]);

  useEffect(() => {
    debouncedSave();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, tone, personaId, platform, language, debouncedSave]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveLocal();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveLocal();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [saveLocal]);

  const restore = useCallback(() => {
    setHasLocalDraft(false);
    setConflict(false);
    try {
      localStorage.removeItem(`${STORAGE_KEY}:${snapshotKey}`);
    } catch {
      // ignore
    }
  }, [snapshotKey]);

  const discard = useCallback(() => {
    setContent("");
    setTone(null);
    setPersonaId(null);
    setPlatform(null);
    setLanguage(null);
    setHasLocalDraft(false);
    setConflict(false);
    try {
      localStorage.removeItem(`${STORAGE_KEY}:${snapshotKey}`);
    } catch {
      // ignore
    }
  }, [snapshotKey]);

  const syncToServer = useCallback(async () => {
    if (!content && !tone && !personaId) return;
    try {
      await api("/api/drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          content,
          tone,
          personaId,
          platform,
          language,
        }),
      });
      restore();
    } catch {
      // offline - will sync later
    }
  }, [chatId, content, tone, personaId, platform, language, restore]);

  return {
    content,
    setContent,
    tone,
    setTone,
    personaId,
    setPersonaId,
    platform,
    setPlatform,
    language,
    setLanguage,
    hasLocalDraft,
    conflict,
    setConflict,
    restore,
    discard,
    syncToServer,
    debouncedSave,
  };
}

export function useOffline() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { online, pending, setPending };
}