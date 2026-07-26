"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { NoConversationEmptyState } from "@/components/workspace/WorkspaceEmptyStates";

export default function ChatIndexPage() {
  const router = useRouter();
  const { createChat, fetchChats } = useChat();

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleNew = async () => {
    const chat = await createChat();
    router.push(`/chat/${chat.id}`);
  };

  return (
    <div className="flex h-full items-center justify-center">
      <NoConversationEmptyState />
    </div>
  );
}
