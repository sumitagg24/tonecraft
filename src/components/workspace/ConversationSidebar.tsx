"use client";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/use-chat";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { ease, spring } from "@/styles/motion";
import {
  Plus, Search, MessageSquare, Star, Pin, Archive, Trash2,
  MoreHorizontal, Pencil, Sparkles, X,
  PanelRightClose, Copy, Share2, ArchiveRestore,
} from "lucide-react";

type GroupLabel = "today" | "yesterday" | "this-week" | "older";

function getChatGroup(createdAt: Date): GroupLabel {
  const now = new Date();
  const diff = now.getTime() - new Date(createdAt).getTime();
  const day = 86400000;
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  if (diff < 7 * day) return "this-week";
  return "older";
}

const groupLabels: Record<GroupLabel, string> = {
  today: "Today", yesterday: "Yesterday", "this-week": "This Week", older: "Older",
};

const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-fuchsia-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

function avatarGradient(title: string) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function formatTime(date: Date) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((startOfToday.getTime() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return new Date(date).toLocaleDateString([], { weekday: "short" });
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ConversationSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { chats, searchQuery, setSearchQuery } = useChatStore();
  const { createChat } = useChat();
  const { toggleSidebar, setMobileSidebarOpen } = useWorkspaceStore();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [view, setView] = useState<"all" | "archived">("all");

  const activeChatId = pathname.startsWith("/chat/") ? pathname.split("/chat/")[1] : null;

  const handleClose = useCallback(() => {
    if (isMobile) setMobileSidebarOpen(false);
    else toggleSidebar();
  }, [isMobile, setMobileSidebarOpen, toggleSidebar]);

  const handleNewChat = useCallback(async () => {
    const chat = await createChat();
    router.push(`/chat/${chat.id}`);
  }, [createChat, router]);

  const list = useMemo(() => {
    let result = chats.filter((c) => (view === "archived") === c.isArchived);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q));
    }
    return result;
  }, [chats, searchQuery, view]);

  const pinned = useMemo(() => (view === "all" ? list.filter((c) => c.isPinned) : []), [list, view]);
  const groupedSource = useMemo(() => (view === "all" ? list.filter((c) => !c.isPinned) : list), [list, view]);
  const archivedCount = useMemo(() => chats.filter((c) => c.isArchived).length, [chats]);

  const groupedChats = useMemo(() => {
    const groups: Record<GroupLabel, typeof chats> = { today: [], yesterday: [], "this-week": [], older: [] };
    for (const chat of groupedSource) {
      groups[getChatGroup(chat.createdAt)].push(chat);
    }
    return groups;
  }, [groupedSource]);

  const showNewEmpty = view === "all" && !searchQuery && list.length === 0;
  const showSearchEmpty = searchQuery && list.length === 0;
  const showArchivedEmpty = view === "archived" && !searchQuery && list.length === 0;

  return (
    <aside className="h-full bg-sidebar/40 backdrop-blur-2xl flex flex-col border-r border-border/30">
      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-border/20">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-glow shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight gradient-text">ToneCraft</span>
          </div>
          <button
            onClick={handleClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
            aria-label="Close sidebar"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-medium shadow-glow transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </button>

        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full h-9 bg-muted/30 border border-border/30 rounded-lg pl-8 pr-7 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            aria-label="Search conversations"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* View filter */}
      <div className="shrink-0 flex gap-1 px-3 pt-2.5 pb-1">
        <button
          onClick={() => setView("all")}
          className={cn(
            "flex-1 h-7 rounded-lg text-[11px] font-medium transition-all",
            view === "all" ? "bg-muted/50 text-foreground" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/20"
          )}
        >
          All
        </button>
        <button
          onClick={() => setView("archived")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 h-7 rounded-lg text-[11px] font-medium transition-all",
            view === "archived" ? "bg-muted/50 text-foreground" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/20"
          )}
          aria-pressed={view === "archived"}
        >
          <Archive className="w-3 h-3" />
          Archived
          {archivedCount > 0 && (
            <span className="text-[9px] px-1 rounded-full bg-muted-foreground/15 text-muted-foreground/70">{archivedCount}</span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {showNewEmpty && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="relative mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-600/10 border border-border/30 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-muted-foreground/30" />
              </div>
            </div>
            <h3 className="text-sm font-semibold mb-1">No conversations yet</h3>
            <p className="text-[11px] text-muted-foreground/60 max-w-[200px] mb-4 leading-relaxed">
              Start your first AI-powered conversation
            </p>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 text-xs font-medium h-8 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-glow hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
            >
              <Plus className="w-3 h-3" />
              New Chat
            </button>
          </div>
        )}

        {showSearchEmpty && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Search className="w-8 h-8 text-muted-foreground/20 mb-3" />
            <p className="text-xs text-muted-foreground/60">No conversations match</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {showArchivedEmpty && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Archive className="w-8 h-8 text-muted-foreground/20 mb-3" />
            <p className="text-xs text-muted-foreground/60">No archived conversations</p>
          </div>
        )}

        {!showNewEmpty && !showSearchEmpty && !showArchivedEmpty && (
          <>
            {pinned.length > 0 && (
              <div className="px-3 pt-3 pb-1">
                <div className="mb-1.5 px-2">
                  <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Pinned</span>
                </div>
                <AnimatePresence mode="popLayout">
                  {pinned.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={activeChatId === chat.id}
                      onSelect={() => router.push(`/chat/${chat.id}`)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {Object.entries(groupedChats).map(([group, groupChats]) =>
              groupChats.length > 0 ? (
                <div key={group} className="px-3 pt-3 pb-1">
                  <div className="mb-1.5 px-2">
                    <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                      {groupLabels[group as GroupLabel]}
                    </span>
                  </div>
                  <AnimatePresence mode="popLayout">
                    {groupChats.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isActive={activeChatId === chat.id}
                        archived={view === "archived"}
                        onSelect={() => router.push(`/chat/${chat.id}`)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : null
            )}
          </>
        )}

        <div className="h-4" />
      </div>
    </aside>
  );
}

function ChatItem({
  chat, isActive, archived, onSelect,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chat: any; isActive: boolean; archived?: boolean; onSelect: () => void;
}) {
  const router = useRouter();
  const { deleteChat, renameChat, togglePin, toggleFavorite, archiveChat, createChat } = useChat();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  const commitRename = useCallback(async () => {
    if (renameValue.trim() && renameValue.trim() !== chat.title) {
      await renameChat(chat.id, renameValue.trim());
    }
    setRenaming(false);
  }, [renameChat, renameValue, chat.id, chat.title]);

  const handleDuplicate = useCallback(async () => {
    const newChat = await createChat({ title: `${chat.title} (copy)` });
    router.push(`/chat/${newChat.id}`);
  }, [createChat, router, chat.title]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${chat.id}`);
    setMenuOpen(false);
  }, [chat.id]);

  const menuItems = archived
    ? [
        { label: "Unarchive", icon: ArchiveRestore, onClick: () => archiveChat(chat.id, false) },
        { label: "Duplicate", icon: Copy, onClick: handleDuplicate },
        { label: "Share", icon: Share2, onClick: handleShare },
        { divider: true },
        { label: "Delete", icon: Trash2, onClick: () => deleteChat(chat.id), destructive: true },
      ]
    : [
        { label: "Rename", icon: Pencil, onClick: () => { setRenameValue(chat.title); setRenaming(true); setMenuOpen(false); } },
        { label: "Duplicate", icon: Copy, onClick: handleDuplicate },
        { label: chat.isFavorite ? "Remove Favorite" : "Favorite", icon: Star, onClick: () => toggleFavorite(chat.id, !chat.isFavorite) },
        { label: chat.isPinned ? "Unpin" : "Pin", icon: Pin, onClick: () => togglePin(chat.id, !chat.isPinned) },
        { label: "Archive", icon: Archive, onClick: () => archiveChat(chat.id, true) },
        { label: "Share", icon: Share2, onClick: handleShare },
        { divider: true },
        { label: "Delete", icon: Trash2, onClick: () => deleteChat(chat.id), destructive: true },
      ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: ease.default }}
      className="group relative"
    >
      <div
        onClick={renaming ? undefined : onSelect}
        className={cn(
          "relative flex items-center gap-2.5 px-2 py-1.5 rounded-xl cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          isActive
            ? "bg-muted/50 border border-border/30 shadow-sm"
            : "border border-transparent hover:bg-muted/20"
        )}
        onContextMenu={(e) => { e.preventDefault(); setMenuOpen((o) => !o); }}
        role="button"
        tabIndex={0}
        aria-label={`Chat: ${chat.title}`}
        onKeyDown={(e) => e.key === "Enter" && onSelect()}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg bg-gradient-to-br shrink-0 flex items-center justify-center text-white text-xs font-semibold select-none",
          avatarGradient(chat.title)
        )}>
          {chat.title.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {renaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") commitRename();
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-muted/40 border border-border/40 rounded-md px-2 py-0.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          ) : (
            <p className="text-sm font-medium truncate leading-tight">
              {chat.isPinned && <Pin className="w-2.5 h-2.5 text-yellow-500 inline-block mr-1 -mt-0.5 fill-yellow-500/60" />}
              {chat.isFavorite && <Star className="w-2.5 h-2.5 text-amber-500 inline-block mr-1 -mt-0.5 fill-amber-500/60" />}
              {chat.title}
            </p>
          )}
        </div>

        {!renaming && (
          <span className="text-[10px] text-muted-foreground/40 shrink-0">
            {formatTime(chat.createdAt)}
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 opacity-70 group-hover:opacity-100 focus-visible:opacity-100 transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="More actions"
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={spring.gentle}
              className="absolute right-2 top-full mt-1 z-50 w-48 py-1.5 rounded-xl bg-popover border border-border/40 shadow-premium backdrop-blur-xl"
            >
              {menuItems.map((item, i) =>
                "divider" in item ? (
                  <div key={i} className="my-1 mx-2 h-px bg-border/30" />
                ) : (
                  <ContextMenuItem
                    key={i}
                    icon={item.icon}
                    label={item.label}
                    onClick={item.onClick}
                    destructive={item.destructive}
                  />
                )
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ContextMenuItem({ icon: Icon, label, onClick, destructive }: { icon: React.ElementType; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-1.5 text-xs transition-all",
        destructive ? "text-destructive hover:bg-destructive/10" : "text-foreground/80 hover:bg-muted/50"
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </button>
  );
}
