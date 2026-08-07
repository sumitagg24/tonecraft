"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeInUp, duration, ease } from "@/styles/motion";
import {
  MessageSquare, Search, Heart, Bookmark, Plus,
  Pin, Archive,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "default" | "gradient" | "glass";
}

export function WorkspaceEmptyState({ icon: Icon, title, description, action, className, variant = "default" }: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ duration: duration.normal, ease: ease.out }}
      className={cn(
        "flex flex-col items-center justify-center py-20 px-6 text-center",
        variant === "glass" && "rounded-2xl border border-border/20 bg-background/30 backdrop-blur-sm mx-4 my-8",
        className
      )}
    >
      {Icon && (
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border/20 flex items-center justify-center">
            <Icon className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent blur-xl" />
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-4 rounded-full bg-primary/5 blur-2xl -z-10"
          />
        </div>
      )}
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground/60 max-w-xs mb-6 leading-relaxed">{description}</p>
      )}
      {action}
    </motion.div>
  );
}

export function NoChatsEmptyState({ onNewChat }: { onNewChat?: () => void }) {
  return (
    <WorkspaceEmptyState
      icon={MessageSquare}
      title="Start your first conversation"
      description="Create a new chat and let AI help you craft the perfect message"
      action={
        onNewChat && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewChat}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-brand text-brand-foreground text-sm font-medium shadow-[0_8px_24px_-8px_hsl(var(--brand)/0.5)] hover:bg-brand/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </motion.button>
        )
      }
    />
  );
}

export function NoSearchResultsEmptyState({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <WorkspaceEmptyState
      icon={Search}
      title="No results found"
      description={`No matches for "${query}". Try a different search term.`}
      action={
        onClear && (
          <button
            onClick={onClear}
            className="text-xs text-primary hover:underline underline-offset-2"
          >
            Clear search
          </button>
        )
      }
    />
  );
}

export function NoFavoritesEmptyState() {
  return (
    <WorkspaceEmptyState
      icon={Heart}
      title="No favorites yet"
      description="Heart your most-used prompts and conversations for quick access"
    />
  );
}

export function NoBookmarksEmptyState() {
  return (
    <WorkspaceEmptyState
      icon={Bookmark}
      title="No bookmarks"
      description="Bookmark messages you want to reference later"
    />
  );
}

export function NoConversationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative mb-8"
      >
        <div className="w-24 h-24 rounded-3xl border border-border/40 bg-card flex items-center justify-center shadow-premium">
          <Logo iconOnly size="xl" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-6 rounded-[40px] bg-brand/10 blur-2xl -z-10"
        />
      </motion.div>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-3">Welcome to ToneCraft</h1>
      <p className="text-sm md:text-base text-muted-foreground/70 max-w-md text-center leading-relaxed">
        Your premium AI communication studio. Select a conversation or start something new.
      </p>
    </div>
  );
}

export function NoPinnedEmptyState() {
  return (
    <WorkspaceEmptyState
      icon={Pin}
      title="No pinned conversations"
      description="Pin your most important conversations for quick access"
    />
  );
}

export function NoArchivedEmptyState() {
  return (
    <WorkspaceEmptyState
      icon={Archive}
      title="No archived conversations"
      description="Archived conversations will appear here"
    />
  );
}
