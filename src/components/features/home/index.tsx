"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ClaudeChatInput from "@/components/ui/claude-style-chat-input";
import { CommandK, type CommandKItem } from "@/components/ui/command-k";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { SOM_DEFAULT_MODEL_ID } from "@/lib/som-models";
import {
  Search,
  Settings,
  MessageSquare,
  Plus,
  HelpCircle,
} from "lucide-react";

import { NavItem } from "@/components/features/home/nav-item";
import { MenuItem } from "@/components/features/home/menu-item";
import { MarkdownContent } from "@/components/features/home/markdown-content";
import { SidebarToggleIcon } from "@/components/features/home/sidebar-toggle-icon";
import { LockedNavItem } from "@/components/features/home/locked-nav-item";
import { CtaButtons } from "@/components/features/home/cta-buttons";
import { Tutorial, type TutorialHandle } from "@/components/features/tutorial";
import type { TutorialAction } from "@/components/features/tutorial/tutorial-slides";

import { useStreamTextLive } from "@/hooks/use-stream-text-live";
import {
  getMessageText,
  getChatTitle,
  streamDisplayText,
} from "@/lib/chat-utils";

import type { ChatHistoryItem, ChatView } from "@/types/chat";

import {
  loadLocalChatHistory,
  loadRemoteChatHistory,
  saveLocalChatHistory,
  upsertChat,
  deleteChatById,
  renameChatById,
} from "@/services/chat-history";
import {
  uploadAvatar,
  removeAvatar,
  isBucketMissingError,
  MISSING_AVATAR_BUCKET_MESSAGE,
} from "@/services/avatar";

export function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [view, setView] = useState<ChatView>("home");
  const [selectedModel, setSelectedModel] = useState(SOM_DEFAULT_MODEL_ID);
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const tutorialRef = useRef<TutorialHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{
    id: string;
    title: string;
    messages: unknown[];
    transcript: string | null;
    timestamp: number;
  }>>([]);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  const { user, signOut } = useAuth();
  const rawFirstName =
    user?.user_metadata?.full_name?.trim().split(/\s+/)[0] ??
    user?.user_metadata?.name?.trim().split(/\s+/)[0] ??
    user?.user_metadata?.given_name ??
    user?.email?.split("@")[0] ??
    "there";
  const firstName =
    rawFirstName === "there"
      ? "there"
      : (() => {
          const lettersOnly = rawFirstName.replace(/\d+$/, "").match(/^[a-zA-Z]+/)?.[0] ?? rawFirstName;
          return lettersOnly[0]!.toUpperCase() + lettersOnly.slice(1).toLowerCase();
        })();
  const fullName =
    (user?.user_metadata?.full_name?.trim() || user?.user_metadata?.name?.trim() || "") ||
    (firstName !== "there" ? firstName : "");
  const profileDisplayName = fullName || firstName || "User";
  const initials = (() => {
    const full = user?.user_metadata?.full_name?.trim() ?? user?.user_metadata?.name?.trim();
    if (full) {
      const parts = full.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
      return (parts[0]!.slice(0, 2)).toUpperCase();
    }
    if (firstName && firstName !== "there") return firstName.slice(0, 2).toUpperCase();
    return user?.email?.slice(0, 2).toUpperCase() ?? "?";
  })();
  const avatarUrl = (user?.user_metadata?.avatar_url as string) || null;

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user?.id) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const client = createClient();
      if (!client) throw new Error("Not configured");
      await uploadAvatar(client, user.id, file);
    } catch (err) {
      setAvatarError(
        isBucketMissingError(err)
          ? MISSING_AVATAR_BUCKET_MESSAGE
          : err instanceof Error
            ? err.message
            : "Failed to update photo."
      );
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }, [user?.id]);

  const handleAvatarRemove = useCallback(async () => {
    if (!user?.id) return;
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const client = createClient();
      if (!client) throw new Error("Not configured");
      await removeAvatar(client, user.id);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to remove photo.");
    } finally {
      setAvatarUploading(false);
    }
  }, [user?.id]);

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const isLoading = status === "streaming" || status === "submitted";

  // Show stream as it arrives — same flow as ChatGPT/Claude. No typewriter; throttle only to avoid re-running markdown every token.
  const lastMsg = messages[messages.length - 1];
  const lastMsgText =
    lastMsg && lastMsg.role === "assistant"
      ? (lastMsg.parts as { type: string; text?: string }[])
          .filter((p) => p.type === "text")
          .map((p) => p.text ?? "")
          .join("")
      : "";
  const isStreamingLast = status === "streaming" && lastMsg?.role === "assistant";
  const streamTextLive = useStreamTextLive(lastMsgText, isStreamingLast);
  const streamingDisplayText = streamDisplayText(streamTextLive, isStreamingLast);

  // Mark as mounted so portals can render into document.body
  useEffect(() => { setMounted(true); }, []);

  // Open sidebar by default on desktop only
  useEffect(() => {
    if (window.innerWidth >= 1024) setSidebarOpen(true);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // Command palette: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const supabase = useMemo(() => createClient(), []);

  // Load chat history from Supabase (or localStorage fallback when env missing)
  useEffect(() => {
    if (supabase && user?.id) {
      loadRemoteChatHistory(supabase)
        .then(setChatHistory)
        .catch((err: unknown) => {
          setDbError(err instanceof Error ? err.message : "Failed to load chats");
        });
    } else if (!supabase) {
      setChatHistory(loadLocalChatHistory());
    }
  }, [supabase, user?.id]);

  // Save current conversation to Supabase (or localStorage) whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;
    const chatId = messages[0].id;
    setActiveChatId(chatId);
    const title = getChatTitle(messages) || "New chat";
    const item: ChatHistoryItem = {
      id: chatId,
      title,
      messages,
      transcript: selectedTranscript,
      timestamp: Date.now(),
    };
    setChatHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== chatId);
      const next = [item, ...filtered].slice(0, 20);
      if (!supabase) saveLocalChatHistory(next);
      return next;
    });
    if (supabase && user?.id) {
      upsertChat({
        supabase,
        userId: user.id,
        chatId,
        title,
        messages,
        transcript: selectedTranscript,
      }).catch((err: unknown) => {
        setDbError(err instanceof Error ? err.message : "Failed to save chat");
      });
    }
  }, [messages, selectedTranscript, supabase, user?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // openMenuId is closed via a backdrop overlay rendered in the JSX — no document listener needed

  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showScrollBottom]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 120);
  }, []);

  const copyMessage = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBottom(false);
  }, []);

  const handleSendMessage = (data: { message: string; model: string }, transcript?: string | null) => {
    if (!data.message.trim()) return;
    setSelectedModel(data.model);
    setView("chat");
    sendMessage({ text: data.message }, { body: { model: data.model, transcript: transcript ?? selectedTranscript } });
  };

  const handleNewChat = () => {
    setMessages([]);
    setView("home");
    setSelectedTranscript(null);
    setActiveChatId(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleTutorialAction = useCallback(
    (action: TutorialAction) => {
      if (action.kind === "try-prompt") {
        handleSendMessage({ message: action.prompt, model: selectedModel });
        return;
      }
      // "open-view" and "finish": just close — no browse views anymore.
    },
    // handleSendMessage is defined in this component and closes over state
    // via refs + setters; no need to include it in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedModel]
  );

  const commandPaletteItems: CommandKItem[] = useMemo(
    () => [
      {
        label: "Search conversations",
        group: "Actions",
        description: "Search your chat history",
        icon: Search,
        shortcut: ["⌘", "K"],
        keywords: ["search", "chats", "history"],
      },
      {
        label: "New chat",
        group: "Actions",
        description: "Start a new conversation",
        icon: Plus,
        shortcut: ["N"],
        keywords: ["new", "chat", "conversation"],
      },
      {
        label: "Chats",
        group: "Navigation",
        description: "Go to chats",
        icon: MessageSquare,
        keywords: ["chat", "conversation"],
      },
      {
        label: "How to use",
        group: "Navigation",
        description: "Replay the getting-started walkthrough",
        icon: HelpCircle,
        keywords: ["tutorial", "help", "walkthrough", "getting started", "how"],
      },
      {
        label: "Settings",
        group: "Navigation",
        description: "Application preferences",
        icon: Settings,
        shortcut: ["O"],
        keywords: ["settings", "preferences"],
      },
    ],
    []
  );

  const handleCommandSelect = useCallback(
    (item: CommandKItem) => {
      setCommandPaletteOpen(false);
      switch (item.label) {
        case "Search conversations":
          setSearchOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 50);
          break;
        case "New chat":
          handleNewChat();
          break;
        case "Chats":
          setView(messages.length > 0 ? "chat" : "home");
          if (window.innerWidth < 1024) setSidebarOpen(false);
          break;
        case "How to use":
          tutorialRef.current?.open();
          if (window.innerWidth < 1024) setSidebarOpen(false);
          break;
        case "Settings":
          setView("settings");
          if (window.innerWidth < 1024) setSidebarOpen(false);
          break;
        default:
          break;
      }
    },
    [messages.length]
  );

  const handleRestoreChat = (item: { id: string; messages: unknown[]; transcript: string | null }) => {
    setMessages(item.messages as Parameters<typeof setMessages>[0]);
    setSelectedTranscript(item.transcript);
    setActiveChatId(item.id);
    setView("chat");
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleDeleteChat = useCallback((id: string) => {
    if (supabase) {
      deleteChatById(supabase, id).catch((err: unknown) => {
        setDbError(err instanceof Error ? err.message : "Failed to delete chat");
      });
    }
    setChatHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      if (!supabase) saveLocalChatHistory(next);
      return next;
    });
    if (id === activeChatId) {
      setMessages([]);
      setView("home");
      setSelectedTranscript(null);
      setActiveChatId(null);
    }
    setDeleteConfirmId(null);
    setOpenMenuId(null);
  }, [activeChatId, setMessages, supabase]);

  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    if (supabase) {
      renameChatById(supabase, id, trimmed).catch((err: unknown) => {
        setDbError(err instanceof Error ? err.message : "Failed to rename chat");
      });
    }
    setChatHistory((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, title: trimmed } : h));
      if (!supabase) saveLocalChatHistory(next);
      return next;
    });
    setRenameId(null);
    setRenameValue("");
  }, [supabase]);

  // Focus rename input when modal opens
  useEffect(() => {
    if (renameId) setTimeout(() => renameInputRef.current?.focus(), 50);
  }, [renameId]);

  // Auto-clear DB error after 5s
  useEffect(() => {
    if (!dbError) return;
    const t = setTimeout(() => setDbError(null), 5000);
    return () => clearTimeout(t);
  }, [dbError]);

  return (
    <>
    <Tutorial ref={tutorialRef} onAction={handleTutorialAction} />
    <CommandK
      items={commandPaletteItems}
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      onSelect={handleCommandSelect}
      placeholder="Search or jump to…"
    />
    {/* DB error toast — dismissible, auto-clears after 5s */}
    {dbError && (
      <div className="fixed bottom-4 left-4 right-4 z-[100] flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-[#1a1a1a] px-4 py-3 shadow-xl sm:left-auto sm:right-4 sm:max-w-sm">
        <p className="text-sm text-red-300">{dbError}</p>
        <button
          type="button"
          onClick={() => setDbError(null)}
          className="shrink-0 rounded-lg p-1.5 text-[#888] hover:bg-[#2a2a2a] hover:text-[#ececec] transition-colors"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    )}
    <div className="flex h-svh min-h-0 w-full overflow-hidden bg-[#1a1a1a] font-sans">

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        flex h-svh flex-col overflow-hidden
        bg-[#181818] border-r border-[#403F3D]
        transition-[transform,width] duration-300 ease-in-out will-change-transform
        fixed inset-y-0 left-0 z-50 w-[260px]
        lg:sticky lg:top-0 lg:relative lg:z-auto lg:flex-shrink-0
        ${sidebarOpen
          ? "translate-x-0 lg:w-[260px]"
          : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0"
        }`}>

        <div className="flex flex-col h-full w-[260px] min-h-0 overflow-visible">

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-1 pt-safe-area-lg lg:pt-4">
            <button
              type="button"
              onClick={() => setView("home")}
              className="text-left"
              aria-label="Go to home"
            >
              <span className="text-lg lg:text-xl font-brand text-[#ececec] tracking-tight select-none">School of Mentors AI</span>
            </button>
<button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-[#666] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <SidebarToggleIcon />
          </button>
          </div>

          {/* Top actions */}
          <div className="px-3 py-1 space-y-0.5">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              <span className="w-4 h-4 flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span className="flex-1 text-left">New chat</span>
            </button>
            {searchOpen ? (
              <div className="px-0 py-0.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#242424] border border-[#383838]">
                  <svg className="w-4 h-4 text-[#555] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } }}
                    placeholder="Search conversations…"
                    className="flex-1 bg-transparent text-sm text-[#ececec] placeholder-[#444] outline-none"
                  />
                  <button
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    className="text-[#444] hover:text-[#888] transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <NavItem label="Search" onClick={() => setCommandPaletteOpen(true)} icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              } />
            )}
          </div>

          {/* Nav items */}
          <div className="px-3 space-y-0.5">
            <NavItem
              active={view === "home" || view === "chat"}
              onClick={() => { setView(messages.length > 0 ? "chat" : "home"); if (window.innerWidth < 1024) setSidebarOpen(false); }}
              label="Chats"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              }
            />
            <LockedNavItem
              label="Mentorship Calls"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <LockedNavItem
              label="Call Recordings"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.91 6.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              }
            />
            <NavItem
              onClick={() => { tutorialRef.current?.open(); if (window.innerWidth < 1024) setSidebarOpen(false); }}
              label="How to use"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
              }
            />
          </div>

          {/* Recents */}
          <div className="mt-2 min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-contain px-3">
            <p className="text-xs text-[#555] px-2 py-1.5 font-medium uppercase tracking-wider">Recents</p>
            <div className="space-y-0.5">
              {(() => {
                const filtered = searchQuery.trim()
                  ? chatHistory.filter((h) => h.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  : chatHistory;
                if (filtered.length === 0) {
                  return (
                    <p className="text-xs text-[#3a3a3a] px-3 py-2">
                      {searchQuery.trim() ? `No results for "${searchQuery}"` : "No conversations yet"}
                    </p>
                  );
                }
                return filtered.slice(0, 10).map((item) => (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => handleRestoreChat(item)}
                      className="w-full text-left px-3 py-2 pr-8 rounded-lg text-sm text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors truncate cursor-pointer"
                      title={item.title ?? "New chat"}
                    >
                      {item.title ?? "New chat"}
                    </button>
                    {/* Three-dot menu trigger */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item.id ? null : item.id); }}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all cursor-pointer
                        ${openMenuId === item.id
                          ? "opacity-100 text-[#ececec] bg-[#333]"
                          : "opacity-0 group-hover:opacity-100 text-[#666] hover:text-[#ececec] hover:bg-[#333]"}`}
                      aria-label="Chat options"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                      </svg>
                    </button>
                    {/* Dropdown + backdrop */}
                    {openMenuId === item.id && (
                      <>
                        {/* Invisible fullscreen backdrop — tapping outside closes menu without swallowing the tap */}
                        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-1 top-full mt-1 w-40 bg-[#2a2a2a] border border-[#383838] rounded-xl shadow-2xl overflow-hidden z-50 py-1">
                          <button
                            onClick={() => { setRenameId(item.id); setRenameValue(item.title ?? ""); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#ccc] hover:text-[#ececec] hover:bg-[#333] transition-colors cursor-pointer"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Rename
                          </button>
                          <button
                            onClick={() => { setDeleteConfirmId(item.id); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-[#333] transition-colors cursor-pointer"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Funnel CTAs — tucked into the bottom of the sidebar */}
          <div className="flex-shrink-0 px-3 pb-2 pt-1">
            <CtaButtons />
          </div>

          {/* User profile — overflow-visible so popup above is not clipped */}
          <div className="h-px bg-[#403F3D] flex-shrink-0" />
          <div className="px-2 pb-3 pt-1.5 relative overflow-visible flex-shrink-0" ref={profileRef}>
            {profileOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#2a2a2a] border border-[#383838] rounded-xl shadow-2xl z-50 py-2 min-w-0 overflow-hidden">
                <div className="px-3 py-2.5 mb-1 border-b border-[#383838]">
                  <p className="text-xs text-[#737373] font-medium uppercase tracking-wider">Account</p>
                  <p className="text-sm text-[#a3a3a3] truncate mt-0.5">{user?.email ?? ""}</p>
                </div>
                <div className="px-1.5 pt-1">
                  <MenuItem label="Settings" right="⇧⌘," onClick={() => { setView("settings"); setProfileOpen(false); if (window.innerWidth < 1024) setSidebarOpen(false); }} icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  } />
                  <MenuItem label="Get help" icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
                    </svg>
                  } />
                </div>
                <div className="h-px bg-[#383838] my-1" />
                <div className="px-1.5">
                  <MenuItem
                    label="Log out"
                    danger
                    onClick={async () => { setProfileOpen(false); await signOut(); window.location.href = "/login"; }}
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    }
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${profileOpen ? "bg-[#2a2a2a]" : "hover:bg-[#2a2a2a]"}`}
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              {avatarUrl ? (
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-[#404040] bg-[#333]">
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#333] border border-[#404040] flex items-center justify-center text-[#ececec] text-sm font-semibold flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#ececec] font-medium truncate">{profileDisplayName}</p>
                <p className="text-xs text-[#737373] truncate select-none">School of Mentors AI</p>
              </div>
              <svg className={`w-4 h-4 text-[#666] flex-shrink-0 transition-transform ${profileOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="relative flex h-svh min-h-0 flex-1 flex-col overflow-hidden bg-[#1a1a1a]">

        {/* ── Mobile top bar (shown when sidebar is closed, hidden on home view) ── */}
        {!sidebarOpen && view !== "home" && (
          <div className="relative flex items-center px-2 pb-3 lg:hidden flex-shrink-0 pt-safe-area">
            {/* Left: sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-[#666] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors cursor-pointer flex-shrink-0"
              aria-label="Open sidebar"
            >
              <SidebarToggleIcon />
            </button>

            {/* Center: title */}
            <div className="absolute inset-x-0 flex justify-center pointer-events-none">
              <span className="text-sm font-semibold text-[#ececec]">
                {view === "chat" && selectedTranscript
                  ? selectedTranscript
                  : view === "settings"
                  ? "Settings"
                  : ""}
              </span>
            </div>

            {/* Right: new chat button */}
            <button
              onClick={handleNewChat}
              className="ml-auto p-1.5 rounded-lg text-[#666] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors cursor-pointer flex-shrink-0"
              aria-label="New chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── Home view: floating sidebar toggle (absolute, top-left) ── */}
        {!sidebarOpen && view === "home" && (
          <div className="absolute top-safe-area left-3 z-10 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-[#555] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <SidebarToggleIcon />
            </button>
          </div>
        )}

        {/* ── Desktop sidebar toggle (hidden on mobile) ── */}
        {!sidebarOpen && (
          <div className="hidden lg:block fixed top-0 left-0 z-10 p-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-[#666] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <SidebarToggleIcon />
            </button>
          </div>
        )}

        {/* ── Home ── */}
        {view === "home" ? (
          <main className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain">
            {/*
              min-h-full + justify-center: centered when content is short; when tall (mobile), the outer main scrolls so nothing is clipped.
            */}
            <div className="flex min-h-full w-full flex-col items-center justify-center px-4 pb-safe pt-[max(5rem,env(safe-area-inset-top,0px)+2.75rem)] lg:px-6 lg:pb-16 lg:pt-8">
              <div className="mb-6 w-full max-w-3xl text-center">
                <div className="mx-auto mb-4 w-fit animate-fade-up">
                  <Image
                    src="/logo.png"
                    alt="School of Mentors AI"
                    width={176}
                    height={176}
                    priority
                    className="logo-no-drag h-28 w-28 object-contain [mix-blend-mode:multiply] select-none pointer-events-none dark:[mix-blend-mode:normal] lg:h-44 lg:w-44"
                    draggable={false}
                  />
                </div>
                <h1 className="mb-2 animate-fade-up-delay font-brand text-2xl tracking-tight text-[#ececec] sm:text-3xl lg:text-4xl">
                  {greeting},{" "}
                  <span className="relative inline-block pb-2">
                    {firstName}
                    <svg
                      className="absolute -bottom-1 -left-[5%] h-[20px] w-[140%] text-[#890B0F]"
                      viewBox="0 0 140 24"
                      fill="none"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path d="M6 16 Q 70 24, 134 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                    </svg>
                  </span>
                </h1>
              </div>

              <ClaudeChatInput onSendMessage={handleSendMessage} isLoading={isLoading} onStop={stop} />
            </div>
          </main>

        /* ── Settings ── */
        ) : view === "settings" ? (
          <main className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 pb-safe pt-5 lg:px-6 lg:pb-8 lg:pt-8">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-2xl font-brand-sub text-[#ececec] mb-1">Settings</h2>
              <p className="text-sm text-[#555] mb-8">Manage your account and preferences.</p>

              <section className="rounded-2xl bg-[#1c1c1c] border border-[#272727] overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-[#272727]">
                  <h3 className="text-sm font-semibold text-[#ececec]">Account</h3>
                </div>
                <div className="p-4 space-y-5">
                  <div className="flex items-center gap-4">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <button
                      type="button"
                      disabled={avatarUploading}
                      onClick={() => {
                      if (avatarInputRef.current) {
                        avatarInputRef.current.value = "";
                        avatarInputRef.current.click();
                      }
                    }}
                      className="flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#890B0F] focus:ring-offset-2 focus:ring-offset-[#1c1c1c] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      aria-label={avatarUploading ? "Uploading…" : "Change profile photo"}
                    >
                      {avatarUrl ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-[#383838] bg-[#2a2a2a] ring-2 ring-transparent hover:ring-[#383838] transition-all">
                          <Image
                            src={avatarUrl}
                            alt=""
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#333] border border-[#404040] flex items-center justify-center text-[#ececec] text-xl font-semibold ring-2 ring-transparent hover:ring-[#383838] transition-all">
                          {initials}
                        </div>
                      )}
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        disabled={avatarUploading}
                        onClick={handleAvatarRemove}
                        className="text-sm text-[#737373] hover:text-[#a3a3a3] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {avatarUploading ? "…" : "Remove photo"}
                      </button>
                    )}
                    {avatarError && <p className="text-xs text-red-400">{avatarError}</p>}
                  </div>
                  <div className="h-px bg-[#272727]" />
                  <div>
                    <p className="text-xs font-medium text-[#737373] uppercase tracking-wider mb-1">Email</p>
                    <p className="text-sm text-[#d4d4d4]">{user?.email ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#737373] uppercase tracking-wider mb-1">Name</p>
                    <p className="text-sm text-[#d4d4d4]">{profileDisplayName}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl bg-[#1c1c1c] border border-[#272727] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#272727]">
                  <h3 className="text-sm font-semibold text-[#ececec]">Support</h3>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-sm text-[#a3a3a3]">Need help? Reach out to the School of Mentors team.</p>
                  <a
                    href="mailto:somai@schoolofmentors.com"
                    className="inline-flex items-center gap-2 text-sm text-[#ececec] hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    somai@schoolofmentors.com
                  </a>
                </div>
              </section>
            </div>
          </main>

        /* ── Chat ── */
        ) : (
          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Scroll-to-bottom button */}
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-28 right-4 z-10 p-2.5 rounded-full bg-[#2a2a2a] border border-[#404040] text-[#ececec] shadow-xl hover:bg-[#333] transition-all duration-200 cursor-pointer"
                aria-label="Scroll to bottom"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              </button>
            )}
            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-3 lg:px-4"
            >
              <div className="max-w-2xl mx-auto min-h-full flex flex-col">
                {/* Top spacer — bottom-anchors short threads on mobile only */}
                <div className="flex-1 min-h-4 lg:hidden" />
              <div className="space-y-5 lg:space-y-6 py-4 lg:py-5">
                {messages.map((m, msgIdx) => {
                  const msgText = getMessageText(m.parts);
                  const isStreamingThis =
                    m.role === "assistant" &&
                    status === "streaming" &&
                    msgIdx === messages.length - 1;
                  const contentToRender = isStreamingThis ? streamingDisplayText : msgText;
                  return (
                    <div key={m.id} className="flex flex-col gap-2">
                      {/* Message bubble */}
                      <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        {m.role === "assistant" && (
                          <div className="w-7 h-7 rounded-full flex-shrink-0 mr-3 mt-0.5 flex items-center justify-center flex-none overflow-hidden">
                            <Image src="/logo.png" alt="SOM" width={28} height={28} draggable={false} className="logo-no-drag w-7 h-7 object-contain select-none pointer-events-none" />
                          </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-[#3a3a3a] text-[#ececec] rounded-br-sm"
                            : "text-[#ececec]"
                        }`}>
                          {m.role === "assistant" ? (
                            <MarkdownContent content={contentToRender} />
                          ) : (
                            msgText
                          )}
                        </div>
                      </div>

                      {/* Copy action — shown below every assistant message */}
                      {m.role === "assistant" && (
                        <div className="ml-10 flex items-center gap-1 mt-0.5">
                          <button
                            onClick={() => copyMessage(m.id, msgText)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[#4a4a4a] hover:text-[#888] hover:bg-[#252525] transition-all duration-150 cursor-pointer"
                          >
                            {copiedId === m.id ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                <span className="text-[11px] text-[#666]">Copied</span>
                              </>
                            ) : (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 mr-3 mt-0.5 flex items-center justify-center flex-none overflow-hidden">
                      <Image src="/logo.png" alt="SOM" width={28} height={28} draggable={false} className="logo-no-drag w-7 h-7 object-contain select-none pointer-events-none" />
                    </div>
                    <div className="py-3.5 flex items-center gap-[5px]">
                      <span className="typing-dot w-[7px] h-[7px] rounded-full bg-[#555] [animation-delay:0s]" />
                      <span className="typing-dot w-[7px] h-[7px] rounded-full bg-[#555] [animation-delay:0.18s]" />
                      <span className="typing-dot w-[7px] h-[7px] rounded-full bg-[#555] [animation-delay:0.36s]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
              </div>
            </div>

            {/* Chat input */}
            <div className="px-2 lg:px-4 pt-2 flex-shrink-0 pb-safe lg:pb-6">
              <div className="max-w-2xl mx-auto">
                <ClaudeChatInput onSendMessage={handleSendMessage} isLoading={isLoading} onStop={stop} />
              </div>
            </div>
          </main>
        )}
      </div>
    </div>

    {/* ── Portals: render modals directly into document.body, bypassing all stacking/overflow constraints ── */}
    {mounted && deleteConfirmId && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
        <div className="relative bg-[#222] border border-[#383838] rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <h2 className="text-base font-semibold text-[#ececec] mb-2">Delete chat</h2>
          <p className="text-sm text-[#888] mb-6">Are you sure you want to delete this chat?</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="min-h-[44px] px-4 py-2 rounded-lg text-sm text-[#ccc] border border-[#383838] hover:bg-[#2a2a2a] active:bg-[#333] transition-colors cursor-pointer touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteChat(deleteConfirmId)}
              className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium bg-[#890B0D] hover:bg-[#a00e10] text-white transition-colors cursor-pointer touch-manipulation"
            >
              Delete
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {mounted && renameId && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRenameId(null)} />
        <div className="relative bg-[#222] border border-[#383838] rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <h2 className="text-base font-semibold text-[#ececec] mb-4">Rename chat</h2>
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameChat(renameId, renameValue);
              if (e.key === "Escape") setRenameId(null);
            }}
            className="w-full px-3 py-2.5 rounded-lg bg-[#2a2a2a] border border-[#484848] text-sm text-[#ececec] outline-none focus:border-[#666] transition-colors mb-5"
            placeholder="Chat name"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setRenameId(null)}
              className="px-4 py-2 rounded-lg text-sm text-[#ccc] border border-[#383838] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleRenameChat(renameId, renameValue)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#ececec] hover:bg-white text-[#111] transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
