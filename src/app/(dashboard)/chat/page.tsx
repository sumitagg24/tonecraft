"use client";
import { useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { NoConversationEmptyState } from "@/components/workspace/WorkspaceEmptyStates";

export default function ChatIndexPage() {
  const { fetchChats } = useChat();

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return (
    <div className="flex h-full items-center justify-center">
      <NoConversationEmptyState />
    </div>
  );
}
