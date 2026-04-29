"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ClaudeChatInput from "@/components/ui/claude-style-chat-input";
import { CommandK, type CommandKItem } from "@/components/ui/command-k";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { SOM_DEFAULT_MODEL_ID } from "@/lib/som-models";
import { Search, Settings, MessageSquare, Plus, HelpCircle } from "lucide-react";

import { SidebarToggleIcon } from "@/components/features/home/sidebar-toggle-icon";
import { Sidebar } from "@/components/features/home/sidebar";
import { SettingsView } from "@/components/features/home/settings-view";
import { ChatView } from "@/components/features/home/chat-view";
import { DeleteChatModal } from "@/components/features/home/delete-chat-modal";
import { RenameChatModal } from "@/components/features/home/rename-chat-modal";
import { Tutorial, type TutorialHandle } from "@/components/features/tutorial";
import type { TutorialAction } from "@/components/features/tutorial/tutorial-slides";

import { useStreamTextLive } from "@/hooks/use-stream-text-live";
import { getMessageText, getChatTitle, streamDisplayText } from "@/lib/chat-utils";
import type { ChatHistoryItem, ChatView as ChatViewType, UIMessage } from "@/types/chat";
import {
  loadLocalChatHistory, loadRemoteChatHistory, saveLocalChatHistory,
  upsertChat, deleteChatById, renameChatById,
} from "@/services/chat-history";

export function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<ChatViewType>("home");
  const [selectedModel, setSelectedModel] = useState(SOM_DEFAULT_MODEL_ID);
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const tutorialRef = useRef<TutorialHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

  const { user, signOut } = useAuth();

  const rawFirstName =
    user?.user_metadata?.full_name?.trim().split(/\s+/)[0] ??
    user?.user_metadata?.name?.trim().split(/\s+/)[0] ??
    user?.user_metadata?.given_name ??
    user?.email?.split("@")[0] ?? "there";
  const firstName = rawFirstName === "there" ? "there" : (() => {
    const lettersOnly = rawFirstName.replace(/\d+$/, "").match(/^[a-zA-Z]+/)?.[0] ?? rawFirstName;
    return lettersOnly[0]!.toUpperCase() + lettersOnly.slice(1).toLowerCase();
  })();
  const fullName = (user?.user_metadata?.full_name?.trim() || user?.user_metadata?.name?.trim() || "") || (firstName !== "there" ? firstName : "");
  const profileDisplayName = fullName || firstName || "User";
  const initials = (() => {
    const full = user?.user_metadata?.full_name?.trim() ?? user?.user_metadata?.name?.trim();
    if (full) {
      const parts = full.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
      return parts[0]!.slice(0, 2).toUpperCase();
    }
    if (firstName && firstName !== "there") return firstName.slice(0, 2).toUpperCase();
    return user?.email?.slice(0, 2).toUpperCase() ?? "?";
  })();
  const avatarUrl = (user?.user_metadata?.avatar_url as string) || null;

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const isLoading = status === "streaming" || status === "submitted";

  const lastMsg = messages[messages.length - 1];
  const lastMsgText = lastMsg?.role === "assistant"
    ? (lastMsg.parts as { type: string; text?: string }[]).filter((p) => p.type === "text").map((p) => p.text ?? "").join("")
    : "";
  const isStreamingLast = status === "streaming" && lastMsg?.role === "assistant";
  const streamTextLive = useStreamTextLive(lastMsgText, isStreamingLast);
  const streamingDisplayText = streamDisplayText(streamTextLive, isStreamingLast);

  useEffect(() => { if (window.innerWidth >= 1024) setSidebarOpen(true); }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    document.body.style.overflow = sidebarOpen && isMobile ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCommandPaletteOpen((o) => !o); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (supabase && user?.id) {
      loadRemoteChatHistory(supabase).then(setChatHistory).catch((err: unknown) => setDbError(err instanceof Error ? err.message : "Failed to load chats"));
    } else if (!supabase) {
      setChatHistory(loadLocalChatHistory());
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    if (messages.length === 0) return;
    const chatId = messages[0].id;
    setActiveChatId(chatId);
    const title = getChatTitle(messages) || "New chat";
    const item: ChatHistoryItem = { id: chatId, title, messages: messages as UIMessage[], transcript: selectedTranscript, timestamp: Date.now() };
    setChatHistory((prev) => {
      const next = [item, ...prev.filter((h) => h.id !== chatId)].slice(0, 20);
      if (!supabase) saveLocalChatHistory(next);
      return next;
    });
    if (supabase && user?.id) {
      upsertChat({ supabase, userId: user.id, chatId, title, messages: messages as UIMessage[], transcript: selectedTranscript })
        .catch((err: unknown) => setDbError(err instanceof Error ? err.message : "Failed to save chat"));
    }
  }, [messages, selectedTranscript, supabase, user?.id]);

  useEffect(() => {
    if (!showScrollBottom) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showScrollBottom]);

  useEffect(() => {
    if (!dbError) return;
    const t = setTimeout(() => setDbError(null), 5000);
    return () => clearTimeout(t);
  }, [dbError]);

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

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setView("home");
    setSelectedTranscript(null);
    setActiveChatId(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [setMessages]);

  const handleTutorialAction = useCallback((action: TutorialAction) => {
    if (action.kind === "try-prompt") handleSendMessage({ message: action.prompt, model: selectedModel });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  const commandPaletteItems: CommandKItem[] = useMemo(() => [
    { label: "New chat", group: "Actions", description: "Start a new conversation", icon: Plus, shortcut: ["N"], keywords: ["new", "chat"] },
    { label: "Chats", group: "Navigation", description: "Go to chats", icon: MessageSquare, keywords: ["chat"] },
    { label: "How to use", group: "Navigation", description: "Replay the getting-started walkthrough", icon: HelpCircle, keywords: ["tutorial", "help"] },
    { label: "Settings", group: "Navigation", description: "Application preferences", icon: Settings, shortcut: ["O"], keywords: ["settings"] },
    { label: "Search conversations", group: "Actions", description: "Search your chat history", icon: Search, shortcut: ["⌘", "K"], keywords: ["search"] },
  ], []);

  const handleCommandSelect = useCallback((item: CommandKItem) => {
    setCommandPaletteOpen(false);
    switch (item.label) {
      case "New chat": handleNewChat(); break;
      case "Chats": setView(messages.length > 0 ? "chat" : "home"); if (window.innerWidth < 1024) setSidebarOpen(false); break;
      case "How to use": tutorialRef.current?.open(); if (window.innerWidth < 1024) setSidebarOpen(false); break;
      case "Settings": setView("settings"); if (window.innerWidth < 1024) setSidebarOpen(false); break;
    }
  }, [messages.length, handleNewChat]);

  const handleRestoreChat = useCallback((item: ChatHistoryItem) => {
    setMessages(item.messages as Parameters<typeof setMessages>[0]);
    setSelectedTranscript(item.transcript);
    setActiveChatId(item.id);
    setView("chat");
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [setMessages]);

  const handleDeleteChat = useCallback((id: string) => {
    if (supabase) deleteChatById(supabase, id).catch((err: unknown) => setDbError(err instanceof Error ? err.message : "Failed to delete chat"));
    setChatHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      if (!supabase) saveLocalChatHistory(next);
      return next;
    });
    if (id === activeChatId) { setMessages([]); setView("home"); setSelectedTranscript(null); setActiveChatId(null); }
    setDeleteConfirmId(null);
  }, [activeChatId, setMessages, supabase]);

  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    if (supabase) renameChatById(supabase, id, trimmed).catch((err: unknown) => setDbError(err instanceof Error ? err.message : "Failed to rename chat"));
    setChatHistory((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, title: trimmed } : h));
      if (!supabase) saveLocalChatHistory(next);
      return next;
    });
    setRenameId(null);
  }, [supabase]);

  return (
    <>
      <Tutorial ref={tutorialRef} onAction={handleTutorialAction} />
      <CommandK items={commandPaletteItems} open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} onSelect={handleCommandSelect} placeholder="Search or jump to…" />

      {dbError && (
        <div className="fixed bottom-4 left-4 right-4 z-[100] flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-[#1a1a1a] px-4 py-3 shadow-xl sm:left-auto sm:right-4 sm:max-w-sm">
          <p className="text-sm text-red-300">{dbError}</p>
          <button type="button" onClick={() => setDbError(null)} className="shrink-0 rounded-lg p-1.5 text-[#888] hover:bg-[#2a2a2a] hover:text-[#ececec] transition-colors" aria-label="Dismiss">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      <div className="flex h-svh min-h-0 w-full overflow-hidden bg-[#1a1a1a] font-sans">
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <Sidebar
          open={sidebarOpen} onClose={() => setSidebarOpen(false)}
          view={view} hasMessages={messages.length > 0} onViewChange={setView}
          chatHistory={chatHistory} activeChatId={activeChatId}
          user={user} avatarUrl={avatarUrl} initials={initials} profileDisplayName={profileDisplayName}
          onNewChat={handleNewChat}
          onRestoreChat={handleRestoreChat}
          onRequestDelete={(id) => setDeleteConfirmId(id)}
          onRequestRename={(id) => setRenameId(id)}
          onSignOut={signOut}
          onOpenSettings={() => { setView("settings"); if (window.innerWidth < 1024) setSidebarOpen(false); }}
          onOpenTutorial={() => tutorialRef.current?.open()}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        <div className="relative flex h-svh min-h-0 flex-1 flex-col overflow-hidden bg-[#1a1a1a]">
          {!sidebarOpen && view !== "home" && (
            <div className="relative flex items-center px-2 pb-3 lg:hidden flex-shrink-0 pt-safe-area">
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-[#666] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors cursor-pointer flex-shrink-0" aria-label="Open sidebar"><SidebarToggleIcon /></button>
              <div className="absolute inset-x-0 flex justify-center pointer-events-none">
                <span className="text-sm font-semibold text-[#ececec]">{view === "chat" && selectedTranscript ? selectedTranscript : view === "settings" ? "Settings" : ""}</span>
              </div>
              <button onClick={handleNewChat} className="ml-auto p-1.5 rounded-lg text-[#666] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors cursor-pointer flex-shrink-0" aria-label="New chat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
              </button>
            </div>
          )}
          {!sidebarOpen && view === "home" && (
            <div className="absolute top-safe-area left-3 z-10 lg:hidden">
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-[#555] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors cursor-pointer" aria-label="Open sidebar"><SidebarToggleIcon /></button>
            </div>
          )}
          {!sidebarOpen && (
            <div className="hidden lg:block fixed top-0 left-0 z-10 p-3">
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-[#666] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors cursor-pointer" aria-label="Open sidebar"><SidebarToggleIcon /></button>
            </div>
          )}

          {view === "home" ? (
            <main className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain">
              <div className="flex min-h-full w-full flex-col items-center justify-center px-4 pb-safe pt-[max(5rem,env(safe-area-inset-top,0px)+2.75rem)] lg:px-6 lg:pb-16 lg:pt-8">
                <div className="mb-6 w-full max-w-3xl text-center">
                  <div className="mx-auto mb-4 w-fit animate-fade-up">
                    <Image src="/logo.png" alt="School of Mentors AI" width={176} height={176} priority className="logo-no-drag h-28 w-28 object-contain [mix-blend-mode:multiply] select-none pointer-events-none dark:[mix-blend-mode:normal] lg:h-44 lg:w-44" draggable={false} />
                  </div>
                  <h1 className="mb-2 animate-fade-up-delay font-brand text-2xl tracking-tight text-[#ececec] sm:text-3xl lg:text-4xl">
                    {firstName !== "there" ? (
                      <>
                        {greeting},{" "}
                        <span className="relative inline-block pb-2">
                          {firstName}
                          <svg className="absolute -bottom-1 -left-[5%] h-[20px] w-[140%] text-[#890B0F]" viewBox="0 0 140 24" fill="none" preserveAspectRatio="none" aria-hidden="true">
                            <path d="M6 16 Q 70 24, 134 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                          </svg>
                        </span>
                      </>
                    ) : (
                      <span className="relative inline-block pb-2">
                        {greeting}
                        <svg className="absolute -bottom-1 -left-[5%] h-[20px] w-[140%] text-[#890B0F]" viewBox="0 0 140 24" fill="none" preserveAspectRatio="none" aria-hidden="true">
                          <path d="M6 16 Q 70 24, 134 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                        </svg>
                      </span>
                    )}
                  </h1>
                </div>
                <ClaudeChatInput onSendMessage={handleSendMessage} isLoading={isLoading} onStop={stop} />
              </div>
            </main>
          ) : view === "settings" ? (
            <SettingsView user={user} initials={initials} profileDisplayName={profileDisplayName} />
          ) : (
            <ChatView
              messages={messages as UIMessage[]}
              status={status}
              isLoading={isLoading}
              streamingDisplayText={streamingDisplayText}
              copiedId={copiedId}
              showScrollBottom={showScrollBottom}
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
              onScroll={handleScroll}
              onCopyMessage={copyMessage}
              onScrollToBottom={scrollToBottom}
              onSendMessage={handleSendMessage}
              onStop={stop}
            />
          )}
        </div>
      </div>

      {deleteConfirmId && <DeleteChatModal onConfirm={() => handleDeleteChat(deleteConfirmId)} onCancel={() => setDeleteConfirmId(null)} />}
      {renameId && (
        <RenameChatModal
          initialTitle={chatHistory.find((h) => h.id === renameId)?.title ?? ""}
          onConfirm={(title) => handleRenameChat(renameId, title)}
          onCancel={() => setRenameId(null)}
        />
      )}
    </>
  );
}
