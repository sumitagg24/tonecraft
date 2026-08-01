"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/use-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatList() {
  const [searchQuery] = useState("");
  const pathname = usePathname();
  const { chats } = useChatStore();
  const { createChat, deleteChat } = useChat();

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = async () => {
    const chat = await createChat();
    window.location.href = `/chat/${chat.id}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2">
        <Button
          onClick={handleNewChat}
          className="w-full gap-2 rounded-xl shadow-premium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          <AnimatePresence>
            {filteredChats.map((chat) => {
              const isActive = pathname === `/chat/${chat.id}`;
              return (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="group flex items-center gap-2"
                >
                  <Link
                    href={`/chat/${chat.id}`}
                    className={cn(
                      "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                      isActive
                        ? "bg-muted/50 font-medium border border-border/40 shadow-sm"
                        : "hover:bg-muted/30 border border-transparent"
                    )}
                  >
                    <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate flex-1">{chat.title}</span>
                    <Badge variant="outline" className="text-[9px] py-0 h-4 border-border/30 capitalize hidden group-hover:flex">
                      {chat.tone}
                    </Badge>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      deleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-opacity"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredChats.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">
              {searchQuery ? "No chats found" : "No chats yet. Start one!"}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
