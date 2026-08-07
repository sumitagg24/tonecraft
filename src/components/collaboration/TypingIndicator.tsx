"use client";
import { motion } from "framer-motion";
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
    <div className="flex items-center gap-2 text-xs text-muted-foreground/70 py-1.5 px-3">
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-foreground/60"
          />
        ))}
      </span>
      <span className="text-nano font-medium">{names} {suffix} typing...</span>
    </div>
  );
}