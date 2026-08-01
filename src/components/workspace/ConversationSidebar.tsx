"use client";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/use-chat";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { cn } from "@/lib/utils";
import { ease, spring } from "@/styles/motion";
import {
  Plus, Search, MessageSquare, Star, Pin, Archive, Trash2,
  MoreHorizontal, Pencil, Sparkles, Clock, X,
  PanelRightClose, Copy, Share2, Wand2, Settings,
  History as HistoryIcon,
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

export function ConversationSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { chats, searchQuery, setSearchQuery } = useChatStore();
  const { createChat, deleteChat, renameChat, togglePin, toggleFavorite, archiveChat } = useChat();
  const { toggleSidebar } = useWorkspaceStore();
  const [showSearch, setShowSearch] = useState(false);
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  const activeChatId = pathname.startsWith("/chat/") ? pathname.split("/chat/")[1] : null;

  const handleNewChat = useCallback(async () => {
    const chat = await createChat();
    router.push(`/chat/${chat.id}`);
  }, [createChat, router]);

  const filteredChats = useMemo(() => {
    let list = chats.filter((c) => !c.isArchived);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q));
    }
    return list;
  }, [chats, searchQuery]);

  const groupedChats = useMemo(() => {
    const groups: Record<GroupLabel, typeof chats> = { today: [], yesterday: [], "this-week": [], older: [] };
    for (const chat of filteredChats) {
      groups[getChatGroup(chat.createdAt)].push(chat);
    }
    return groups;
  }, [filteredChats]);

  const pinnedChats = useMemo(() => chats.filter((c) => c.isPinned), [chats]);
  const favoriteChats = useMemo(() => chats.filter((c) => c.isFavorite), [chats]);

  const handleRename = useCallback(async (id: string) => {
    if (renameValue.trim()) {
      await renameChat(id, renameValue.trim());
    }
    setRenaming(null);
  }, [renameChat, renameValue]);

  const handleDuplicate = useCallback(async (chat: typeof chats[0]) => {
    const newChat = await createChat({ title: `${chat.title} (copy)` });
    router.push(`/chat/${newChat.id}`);
  }, [createChat, router]);

  const handleShare = useCallback((id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${id}`);
    setContextMenu(null);
  }, []);

  return (
    <aside className="h-full bg-sidebar/40 backdrop-blur-2xl flex flex-col border-r border-border/30">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-glow shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight gradient-text">ToneCraft</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
            aria-label="Close sidebar"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          {showSearch ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                onKeyDown={(e) => e.key === "Escape" && setShowSearch(false)}
                placeholder="Search conversations..."
                className="w-full h-9 bg-muted/30 border border-border/30 rounded-xl pl-9 pr-8 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                aria-label="Search conversations"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setShowSearch(false); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={handleNewChat}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-medium shadow-glow transition-all active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                New Chat
              </button>
              <button
                onClick={() => setShowSearch(true)}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-border/30 transition-all"
                aria-label="Search conversations"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {pinnedChats.length > 0 && (
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-1.5 mb-1.5 px-2">
              <Pin className="w-3 h-3 text-yellow-500/60" />
              <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Pinned</span>
            </div>
            <AnimatePresence>
              {pinnedChats.map((chat, i) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={activeChatId === chat.id}
                  index={i}
                  onSelect={() => router.push(`/chat/${chat.id}`)}
                  onRename={(id) => { setRenaming(id); setRenameValue(chat.title); setContextMenu(null); }}
                  onDelete={deleteChat}
                  onPin={(id, val) => togglePin(id, val)}
                  onFavorite={(id, val) => toggleFavorite(id, val)}
                  onArchive={archiveChat}
                  onDuplicate={handleDuplicate}
                  onShare={handleShare}
                  isRenaming={renaming === chat.id}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  onRenameSubmit={handleRename}
                  renameRef={renameInputRef}
                  contextMenu={contextMenu}
                  setContextMenu={setContextMenu}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {favoriteChats.length > 0 && pinnedChats.length === 0 && (
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-1.5 mb-1.5 px-2">
              <Star className="w-3 h-3 text-amber-500/60" />
              <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Favorites</span>
            </div>
            <AnimatePresence mode="popLayout">
              {favoriteChats.slice(0, 3).map((chat, i) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={activeChatId === chat.id}
                  index={i}
                  onSelect={() => router.push(`/chat/${chat.id}`)}
                  onRename={(id) => { setRenaming(id); setRenameValue(chat.title); setContextMenu(null); }}
                  onDelete={deleteChat}
                  onPin={(id, val) => togglePin(id, val)}
                  onFavorite={(id, val) => toggleFavorite(id, val)}
                  onArchive={archiveChat}
                  onDuplicate={handleDuplicate}
                  onShare={handleShare}
                  isRenaming={renaming === chat.id}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  onRenameSubmit={handleRename}
                  renameRef={renameInputRef}
                  contextMenu={contextMenu}
                  setContextMenu={setContextMenu}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredChats.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="relative mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-600/10 border border-border/30 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent blur-xl" />
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

        {filteredChats.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Search className="w-8 h-8 text-muted-foreground/20 mb-3" />
            <p className="text-xs text-muted-foreground/60">No conversations match</p>
            <button
              onClick={() => { setSearchQuery(""); setShowSearch(false); }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {Object.entries(groupedChats).map(([group, groupChats]) =>
          groupChats.length > 0 && (pinnedChats.length === 0 || group !== "today") ? (
            <div key={group} className="px-3 pt-3 pb-1">
              <div className="flex items-center gap-1.5 mb-1.5 px-2">
                <Clock className="w-3 h-3 text-muted-foreground/40" />
                <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  {groupLabels[group as GroupLabel]}
                </span>
              </div>
              <AnimatePresence mode="popLayout">
                {groupChats.map((chat, i) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={activeChatId === chat.id}
                    index={i}
                    onSelect={() => router.push(`/chat/${chat.id}`)}
                    onRename={(id) => { setRenaming(id); setRenameValue(chat.title); setContextMenu(null); }}
                    onDelete={deleteChat}
                    onPin={(id, val) => togglePin(id, val)}
                    onFavorite={(id, val) => toggleFavorite(id, val)}
                    onArchive={archiveChat}
                    onDuplicate={handleDuplicate}
                    onShare={handleShare}
                    isRenaming={renaming === chat.id}
                    renameValue={renameValue}
                    setRenameValue={setRenameValue}
                    onRenameSubmit={handleRename}
                    renameRef={renameInputRef}
                    contextMenu={contextMenu}
                    setContextMenu={setContextMenu}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : null
        )}

        <div className="h-4" />
      </div>

      <div className="shrink-0 px-3 py-3 border-t border-border/20">
        <QuickActionButtons />
      </div>
    </aside>
  );
}

function ChatItem({
  chat, isActive, onSelect, onRename, onDelete, onPin, onFavorite,
  onArchive, onDuplicate, onShare, isRenaming, renameValue, setRenameValue,
  onRenameSubmit, renameRef, contextMenu, setContextMenu,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chat: any; isActive: boolean; index: number; onSelect: () => void;
  onRename: (id: string) => void; onDelete: (id: string) => void;
  onPin: (id: string, val: boolean) => void; onFavorite: (id: string, val: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onArchive: (id: string, val: boolean) => void; onDuplicate: (chat: any) => void;
  onShare: (id: string) => void; isRenaming: boolean; renameValue: string;
  setRenameValue: (val: string) => void; onRenameSubmit: (id: string) => void;
  renameRef: React.RefObject<HTMLInputElement | null>;
  contextMenu: string | null; setContextMenu: (id: string | null) => void;
}) {
  const toneLabel = chat.tone || "chat";
  const msgCount = chat._count?.messages ?? 0;

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
        onClick={isRenaming ? undefined : onSelect}
        className={cn(
          "relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150",
          isActive
            ? "bg-muted/50 border border-border/30 shadow-sm"
            : "border border-transparent hover:bg-muted/20"
        )}
        onContextMenu={(e) => { e.preventDefault(); setContextMenu(contextMenu === chat.id ? null : chat.id); }}
        role="button"
        tabIndex={0}
        aria-label={`Chat: ${chat.title}`}
        onKeyDown={(e) => e.key === "Enter" && onSelect()}
      >
        <div className={cn(
          "w-2 h-2 rounded-full shrink-0 transition-all",
          isActive ? "bg-primary shadow-sm" : "bg-muted-foreground/20 group-hover:bg-muted-foreground/40"
        )} />
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              ref={renameRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => onRenameSubmit(chat.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameSubmit(chat.id);
                if (e.key === "Escape") onRenameSubmit(chat.id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-muted/40 border border-border/40 rounded-md px-2 py-0.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
          ) : (
            <>
              <p className="text-sm font-medium truncate leading-tight">
                {chat.isPinned && <Pin className="w-2.5 h-2.5 text-yellow-500 inline-block mr-1 -mt-0.5 fill-yellow-500/60" />}
                {chat.isFavorite && <Star className="w-2.5 h-2.5 text-amber-500 inline-block mr-1 -mt-0.5 fill-amber-500/60" />}
                {chat.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground/50 capitalize">{toneLabel}</span>
                {msgCount > 0 && (
                  <span className="text-[10px] text-muted-foreground/40">{msgCount} msgs</span>
                )}
              </div>
            </>
          )}
        </div>

        {!isRenaming && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <ContextMenuButton
              icon={MoreHorizontal}
              onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu === chat.id ? null : chat.id); }}
              label="More"
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {contextMenu === chat.id && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setContextMenu(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={spring.gentle}
              className="absolute right-0 top-full mt-1 z-50 w-48 py-1.5 rounded-xl bg-popover border border-border/40 shadow-premium backdrop-blur-xl"
            >
              <ContextMenuItem icon={Pencil} label="Rename" onClick={() => onRename(chat.id)} />
              <ContextMenuItem icon={Copy} label="Duplicate" onClick={() => onDuplicate(chat)} />
              <ContextMenuItem icon={Star} label={chat.isFavorite ? "Unfavorite" : "Favorite"} onClick={() => onFavorite(chat.id, !chat.isFavorite)} />
              <ContextMenuItem icon={Pin} label={chat.isPinned ? "Unpin" : "Pin"} onClick={() => onPin(chat.id, !chat.isPinned)} />
              <ContextMenuItem icon={Archive} label={chat.isArchived ? "Unarchive" : "Archive"} onClick={() => onArchive(chat.id, !chat.isArchived)} />
              <ContextMenuItem icon={Share2} label="Share" onClick={() => onShare(chat.id)} />
              <div className="my-1 mx-2 h-px bg-border/30" />
              <ContextMenuItem icon={Trash2} label="Delete" onClick={() => onDelete(chat.id)} destructive />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ContextMenuButton({ icon: Icon, onClick, label }: { icon: React.ElementType; onClick: (e: React.MouseEvent) => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-all"
      title={label}
      aria-label={label}
    >
      <Icon className="w-3 h-3" />
    </button>
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

function QuickActionButtons() {
  const router = useRouter();
  const items = [
    { icon: HistoryIcon, label: "History", href: "/chat" },
    { icon: Wand2, label: "Tools", href: "/tools" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];
  return (
    <div className="flex gap-1">
      {items.map((item) => (
        <button
          key={item.href}
          onClick={() => router.push(item.href)}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 transition-all"
        >
          <item.icon className="w-3.5 h-3.5" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
