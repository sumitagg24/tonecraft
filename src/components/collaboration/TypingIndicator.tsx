"use client";
import React from "react";
import { useCollaboration } from "@/components/collaboration/CollaborationProvider";

interface TypingIndicatorProps {
  chatId: string;
}

export function TypingIndicator({ chatId }: TypingIndicatorProps) {
  const { typingUsers } = useCollaboration();
  const typing = typingUsers.get(chatId) ?? [];

  if (typing.length === 0) return null;

  const names = typing.map((t) => t.name ?? "Someone").join(", ");
  const suffix = typing.length === 1 ? "is" : "are";

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
      </span>
      <span>{names} {suffix} typing...</span>
    </div>
  );
}