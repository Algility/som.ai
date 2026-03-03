"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ClaudeChatInput from "@/components/ui/claude-style-chat-input";

const SidebarToggleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3V21M7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NavItem = ({ icon, label, right, active, onClick }: { icon: React.ReactNode; label: string; right?: React.ReactNode; active?: boolean; onClick?: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
    ${active ? "text-[#ececec] bg-[#2a2a2a]" : "text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#2a2a2a]"}`}>
    <span className="w-4 h-4 flex-shrink-0">{icon}</span>
    <span className="flex-1 text-left">{label}</span>
    {right && <span className="ml-auto">{right}</span>}
  </button>
);

const MenuDivider = () => <div className="h-px bg-[#403F3D] my-1" />;

const MenuItem = ({ icon, label, right, danger }: { icon?: React.ReactNode; label: string; right?: React.ReactNode; danger?: boolean }) => (
  <button className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
    ${danger ? "text-red-400 hover:bg-[#333]" : "text-[#ccc] hover:text-[#ececec] hover:bg-[#333]"}`}>
    {icon && <span className="w-4 h-4 flex-shrink-0 opacity-70">{icon}</span>}
    <span className="flex-1 text-left">{label}</span>
    {right && <span className="text-[#555] text-xs ml-auto">{right}</span>}
  </button>
);

const SPEAKER_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

const SpeakerAvatar = ({ speaker, initials }: { speaker: string | null; initials: string }) => {
  const [extIndex, setExtIndex] = React.useState(0);
  const ext = SPEAKER_EXTENSIONS[extIndex];
  const src = speaker ? `/speakers/${speaker}.${ext}` : null;
  const failed = extIndex >= SPEAKER_EXTENSIONS.length;

  if (src && !failed) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-[#2a2a2a]">
        <img
          src={src}
          alt={speaker ?? ""}
          className="w-full h-full object-cover object-top"
          onError={() => setExtIndex((i) => i + 1)}
        />
      </div>
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-[#2a2a2a] group-hover:bg-[#333] flex items-center justify-center text-xs font-semibold text-[#888] flex-shrink-0 transition-colors">
      {initials}
    </div>
  );
};

const PodcastAvatar = ({ speaker, initials }: { speaker: string | null; initials: string }) => {
  const [extIndex, setExtIndex] = React.useState(0);
  const ext = SPEAKER_EXTENSIONS[extIndex];
  const src = speaker ? `/speakers/${speaker}.${ext}` : null;
  const failed = extIndex >= SPEAKER_EXTENSIONS.length;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={speaker ?? ""}
        className="w-full h-full object-cover object-top"
        onError={() => setExtIndex((i) => i + 1)}
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-base font-semibold text-[#666]">
      {initials}
    </div>
  );
};

// Extract YouTube video ID from short or long URL
function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Parse speaker name from podcast title like "Andy Elliott on Making $715k..."
// Also handles "Title | Speaker" and "Title  Speaker" (double-space) formats
function parsePodcast(title: string): { speaker: string | null; topic: string; initials: string } {
  // Format 1: "Speaker on Topic"
  const onMatch = title.match(/^(.+?)\s+on\s+(.+)$/i);
  if (onMatch) {
    const speaker = onMatch[1].trim();
    const topic = onMatch[2].trim();
    const initials = speaker.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return { speaker, topic, initials };
  }
  // Format 2: "Topic | Speaker" or "Topic  Speaker" (pipe or double-space suffix)
  const suffixMatch = title.match(/^(.+?)\s*(?:\||\s{2,})\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*$/);
  if (suffixMatch) {
    const topic = suffixMatch[1].trim();
    const speaker = suffixMatch[2].trim();
    const initials = speaker.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return { speaker, topic, initials };
  }
  const initials = title.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return { speaker: null, topic: title, initials };
}

// Extract a short title from the first user message in a conversation
function getChatTitle(msgs: Array<{ role: string; parts: unknown[] }>): string {
  const firstUser = msgs.find((m) => m.role === "user");
  if (!firstUser) return "New chat";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (firstUser.parts as any[]).filter((p: any) => p.type === "text").map((p: any) => p.text as string).join("");
  return text.length > 46 ? text.slice(0, 45) + "…" : text;
}

// Shared empty-state placeholder used by recordings + sessions views
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#1c1c1c] border border-[#272727] flex items-center justify-center mb-5 text-[#444]">
        {icon}
      </div>
      <p className="text-sm font-medium text-[#4a4a4a] mb-1.5">{title}</p>
      <p className="text-xs text-[#3a3a3a] max-w-xs leading-relaxed">{subtitle}</p>
    </div>
  );
}

// Memoised markdown renderer — only re-renders when content string changes.
// This means completed messages stay frozen while the streaming one updates.
const MarkdownContent = React.memo(function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        h1: ({ children }) => <h1 className="text-base font-semibold mt-4 mb-1.5 text-[#f0f0f0]">{children}</h1>,
        h2: ({ children }) => <h2 className="text-[0.95rem] font-semibold mt-3 mb-1 text-[#f0f0f0]">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mt-2.5 mb-0.5 text-[#f0f0f0]">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        code: ({ className, children }: any) => className
          ? <code className={`${className} text-[#e8c8a0] font-mono text-[0.82em]`}>{children}</code>
          : <code className="bg-[#272727] text-[#e8c8a0] px-1.5 py-[2px] rounded text-[0.83em] font-mono">{children}</code>,
        pre: ({ children }) => (
          <pre className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 my-2 overflow-x-auto leading-relaxed text-[0.82em]">
            {children}
          </pre>
        ),
        strong: ({ children }) => <strong className="font-semibold text-[#f0f0f0]">{children}</strong>,
        em: ({ children }) => <em className="italic text-[#ccc]">{children}</em>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#c8a870] underline underline-offset-2 hover:text-[#d4b880]">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[#3a3a3a] pl-3 my-2 text-[#888] italic">{children}</blockquote>
        ),
        hr: () => <hr className="border-t border-[#2a2a2a] my-3" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [view, setView] = useState<"home" | "chat" | "podcasts" | "recordings" | "sessions">("home");
  const [selectedModel, setSelectedModel] = useState("haiku-4.5");
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(null);
  const [transcriptList, setTranscriptList] = useState<{ title: string; preview: string; summary?: string; youtube?: string }[]>([]);
  const [hoveredPodcast, setHoveredPodcast] = useState<{
    speaker: string | null;
    topic: string;
    initials: string;
    summary?: string;
  } | null>(null);
  const [expandedPodcast, setExpandedPodcast] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [chatHistory, setChatHistory] = useState<Array<{
    id: string;
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: any[];
    transcript: string | null;
    timestamp: number;
  }>>([]);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  const userName = "Joel";

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const isLoading = status === "streaming" || status === "submitted";

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

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("som_chat_history");
      if (saved) setChatHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // Save current conversation to history whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;
    const chatId = messages[0].id;
    const title = getChatTitle(messages);
    const item = { id: chatId, title, messages, transcript: selectedTranscript, timestamp: Date.now() };
    setChatHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== chatId);
      const next = [item, ...filtered].slice(0, 20);
      try { localStorage.setItem("som_chat_history", JSON.stringify(next)); } catch {}
      return next;
    });
  }, [messages, selectedTranscript]);

  useEffect(() => {
    fetch("/api/transcripts")
      .then((r) => r.json())
      .then((data: { title: string; preview: string; summary?: string; youtube?: string }[]) => setTranscriptList(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close chat context menu when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    const handle = () => setOpenMenuId(null);
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [openMenuId]);

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

  const handleSelectPodcast = (title: string) => {
    setMessages([]);
    setSelectedTranscript(title);
    setExpandedPodcast(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
    const { speaker } = parsePodcast(title);
    const prompt = speaker
      ? `Give me the key takeaways from the ${speaker} podcast.`
      : `Give me the key takeaways from the "${title}" podcast.`;
    handleSendMessage({ message: prompt, model: selectedModel }, title);
  };

  const handleNewChat = () => {
    setMessages([]);
    setView("home");
    setSelectedTranscript(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleRestoreChat = (item: { id: string; messages: unknown[]; transcript: string | null }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMessages(item.messages as any);
    setSelectedTranscript(item.transcript);
    setView("chat");
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleDeleteChat = useCallback((id: string) => {
    setChatHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      try { localStorage.setItem("som_chat_history", JSON.stringify(next)); } catch {}
      return next;
    });
    setDeleteConfirmId(null);
    setOpenMenuId(null);
  }, []);

  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setChatHistory((prev) => {
      const next = prev.map((h) => h.id === id ? { ...h, title: trimmed } : h);
      try { localStorage.setItem("som_chat_history", JSON.stringify(next)); } catch {}
      return next;
    });
    setRenameId(null);
    setRenameValue("");
  }, []);

  // Focus rename input when modal opens
  useEffect(() => {
    if (renameId) setTimeout(() => renameInputRef.current?.focus(), 50);
  }, [renameId]);

  return (
    <div className="h-[100dvh] w-full bg-[#1a1a1a] flex font-sans overflow-hidden">

      {/* ── Delete confirmation modal ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-[#222] border border-[#383838] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-[#ececec] mb-2">Delete chat</h2>
            <p className="text-sm text-[#888] mb-6">Are you sure you want to delete this chat?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg text-sm text-[#ccc] border border-[#383838] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteChat(deleteConfirmId)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rename modal ── */}
      {renameId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        </div>
      )}

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        h-[100dvh] flex flex-col overflow-hidden
        bg-[#181818] border-r border-[#403F3D]
        transition-[transform,width] duration-300 ease-in-out will-change-transform
        fixed inset-y-0 left-0 z-50 w-[260px]
        lg:sticky lg:top-0 lg:relative lg:z-auto lg:flex-shrink-0
        ${sidebarOpen
          ? "translate-x-0 lg:w-[260px]"
          : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0"
        }`}>

        <div className="flex flex-col h-full w-[260px] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-1 pt-safe-area-lg lg:pt-4">
            <span className="text-sm font-semibold text-[#ececec] tracking-tight">School of Mentors</span>
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
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#ececec] hover:bg-[#2a2a2a] transition-colors font-medium cursor-pointer"
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
              <NavItem label="Search" onClick={() => setSearchOpen(true)} icon={
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
            <NavItem
              active={view === "recordings"}
              onClick={() => { setView("recordings"); if (window.innerWidth < 1024) setSidebarOpen(false); }}
              label="Call Recordings"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.91 6.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              }
            />
            <NavItem
              active={view === "sessions"}
              onClick={() => { setView("sessions"); if (window.innerWidth < 1024) setSidebarOpen(false); }}
              label="Mentor Sessions"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <NavItem
              active={view === "podcasts"}
              onClick={() => { setView("podcasts"); if (window.innerWidth < 1024) setSidebarOpen(false); }}
              label="Podcasts"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="11" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="8" y1="22" x2="16" y2="22" />
                </svg>
              }
            />
          </div>

          {/* Recents */}
          <div className="flex-1 overflow-y-auto px-3 mt-2">
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
                      title={item.title}
                    >
                      {item.title}
                    </button>
                    {/* Three-dot menu trigger */}
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
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
                    {/* Dropdown */}
                    {openMenuId === item.id && (
                      <div
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute right-1 top-full mt-1 w-40 bg-[#2a2a2a] border border-[#383838] rounded-xl shadow-2xl overflow-hidden z-50 py-1"
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); setRenameId(item.id); setRenameValue(item.title); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#ccc] hover:text-[#ececec] hover:bg-[#333] transition-colors cursor-pointer"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Rename
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-[#333] transition-colors cursor-pointer"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* User profile */}
          <div className="h-px bg-[#403F3D]" />
          <div className={`px-3 pb-3 pt-2 relative cursor-pointer ${profileOpen ? "bg-[#2a2a2a]" : "hover:bg-[#222]"}`} ref={profileRef}>

            {profileOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#323232] rounded-xl shadow-2xl overflow-hidden py-1.5 z-50">
                <div className="px-3 py-2 mb-0.5">
                  <p className="text-xs text-[#666]">joel@schoolofmentors.com</p>
                </div>
                <MenuDivider />
                <div className="px-1.5">
                  <MenuItem label="Settings" right="⇧⌘," icon={
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
                <MenuDivider />
                <div className="px-1.5">
                  <MenuItem label="Log out" danger icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  } />
                </div>
              </div>
            )}

            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-transparent border border-[#505050] flex items-center justify-center text-[#ececec] text-sm font-semibold flex-shrink-0">
                J
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm text-[#ececec] font-medium truncate">Joel Kaplan</p>
                <p className="text-xs text-[#666] truncate">School of Mentors</p>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-[#1a1a1a] relative">

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
              {view === "chat" && selectedTranscript ? (
                (() => {
                  const { speaker, topic } = parsePodcast(selectedTranscript);
                  return (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0 bg-[#2a2a2a]">
                        <PodcastAvatar speaker={speaker} initials={(speaker ?? topic).slice(0, 2).toUpperCase()} />
                      </div>
                      <span className="text-sm text-[#ececec] font-semibold">{speaker ?? topic}</span>
                    </div>
                  );
                })()
              ) : (
                <span className="text-sm font-semibold text-[#ececec]">
                  {view === "podcasts" ? "Podcasts" : view === "recordings" ? "Call Recordings" : view === "sessions" ? "Mentor Sessions" : ""}
                </span>
              )}
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
          <main className="flex-1 flex flex-col items-center justify-center px-4 pb-safe lg:pb-16">
            <div className="w-full max-w-3xl mb-6 text-center">
              <div className="w-fit mx-auto mb-4 animate-fade-up">
                <img
                  src="/logo.png"
                  alt="School of Mentors"
                  className="w-28 h-28 lg:w-44 lg:h-44 object-contain [mix-blend-mode:multiply] dark:[mix-blend-mode:normal] select-none pointer-events-none"
                  draggable={false}
                />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light text-[#ececec] mb-3 tracking-tight animate-fade-up-delay">
                {greeting},{" "}
                <span className="relative inline-block pb-2">
                  {userName}
                  <svg
                    className="absolute w-[140%] h-[20px] -bottom-1 -left-[5%] text-[#890B0F]"
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

            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl mx-auto px-4">
              {(["Call Recordings", "Mentor Sessions", "Podcasts", "Resources"] as const).map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    if (label === "Podcasts") setView("podcasts");
                    else if (label === "Call Recordings") setView("recordings");
                    else if (label === "Mentor Sessions") setView("sessions");
                    else handleSendMessage({ message: `Show me ${label}`, model: selectedModel });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#888] bg-transparent border border-[#333] rounded-full hover:bg-[#242424] hover:text-[#ccc] hover:border-[#444] transition-colors duration-150 cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>

          </main>

        /* ── Podcasts ── */
        ) : view === "podcasts" ? (
          <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 lg:py-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="hidden lg:block text-2xl font-serif font-light text-[#ececec] mb-1">Podcasts</h2>
              <p className="hidden lg:block text-sm text-[#555] mb-8">Select an episode to start a conversation.</p>

              {transcriptList.length === 0 ? (
                <p className="text-sm text-[#555]">No transcripts found. Add .txt files to src/data/transcripts/</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {transcriptList.map(({ title, summary }) => {
                    const { speaker, topic, initials } = parsePodcast(title);
                    const isExpanded = expandedPodcast === title;
                    return (
                      <div
                        key={title}
                        onMouseEnter={() => setHoveredPodcast({ speaker, topic, initials, summary })}
                        onMouseLeave={() => setHoveredPodcast(null)}
                        className="rounded-2xl bg-[#1c1c1c] hover:bg-[#212121] border border-[#272727] hover:border-[#333] transition-all duration-200 group overflow-hidden"
                      >
                        <div className="flex items-center gap-3 lg:gap-4 p-3.5 lg:p-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#2a2a2a]">
                            <PodcastAvatar speaker={speaker} initials={initials} />
                          </div>

                          {/* Text — navigates on all screen sizes */}
                          <button
                            onClick={() => handleSelectPodcast(title)}
                            className="min-w-0 flex-1 text-left cursor-pointer"
                          >
                            {speaker && (
                              <p className="text-[11px] font-medium text-[#890B0F] uppercase tracking-widest mb-1">{speaker}</p>
                            )}
                            <p className="text-sm font-medium text-[#d0d0d0] group-hover:text-[#ececec] line-clamp-2 leading-snug transition-colors">
                              {topic}
                            </p>
                          </button>

                          {/* Desktop: navigate arrow */}
                          <button
                            onClick={() => handleSelectPodcast(title)}
                            className="hidden xl:flex flex-shrink-0 w-7 h-7 rounded-full bg-[#2a2a2a] group-hover:bg-[#890B0F]/20 items-center justify-center transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 text-[#555] group-hover:text-[#890B0F] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </button>

                          {/* Mobile: expand/collapse toggle */}
                          <button
                            onClick={() => setExpandedPodcast(isExpanded ? null : title)}
                            className="xl:hidden flex-shrink-0 w-7 h-7 rounded-full bg-[#2a2a2a] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <svg
                              className={`w-3.5 h-3.5 text-[#555] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </button>
                        </div>

                        {/* Mobile expandable preview */}
                        {isExpanded && (
                          <div className="xl:hidden px-4 pb-4">
                            <div className="border-t border-[#272727] pt-4">
                              <p className="text-xs text-[#888] leading-relaxed mb-4">{summary ?? "No summary available."}</p>
                              <button
                                onClick={() => handleSelectPodcast(title)}
                                className="w-full py-2.5 px-4 rounded-xl bg-[#890B0F] hover:bg-[#a01010] text-white text-sm font-medium transition-colors cursor-pointer"
                              >
                                Start chatting
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop hover preview card */}
            <div
              className={`fixed right-6 top-1/2 -translate-y-1/2 w-64 z-40 pointer-events-none hidden xl:block transition-all duration-200 ${
                hoveredPodcast ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3"
              }`}
            >
              {hoveredPodcast && (
                <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden">
                  <div className="w-full aspect-[4/3] bg-[#242424] overflow-hidden">
                    <PodcastAvatar speaker={hoveredPodcast.speaker} initials={hoveredPodcast.initials} />
                  </div>
                  <div className="p-4">
                    {hoveredPodcast.speaker && (
                      <p className="text-[10px] font-semibold text-[#890B0F] uppercase tracking-widest mb-1.5">
                        {hoveredPodcast.speaker}
                      </p>
                    )}
                    <p className="text-sm font-medium text-[#d4d4d4] leading-snug mb-3">
                      {hoveredPodcast.topic}
                    </p>
                    <p className="text-xs text-[#666] leading-relaxed">
                      {hoveredPodcast.summary ?? "No summary available."}
                    </p>
                    <div className="mt-4 pt-3 border-t border-[#272727] flex items-center gap-1.5 text-[10px] text-[#4a4a4a]">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Click to start chatting
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>

        /* ── Call Recordings ── */
        ) : view === "recordings" ? (
          <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 lg:py-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="hidden lg:block text-2xl font-serif font-light text-[#ececec] mb-1">Call Recordings</h2>
              <p className="hidden lg:block text-sm text-[#555] mb-8">Your recorded mentor sessions, all in one place.</p>
              <EmptyState
                icon={
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.91 6.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                }
                title="No recordings yet"
                subtitle="Call recordings will be available here once your mentor sessions are uploaded."
              />
            </div>
          </main>

        /* ── Mentor Sessions ── */
        ) : view === "sessions" ? (
          <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 lg:py-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="hidden lg:block text-2xl font-serif font-light text-[#ececec] mb-1">Mentor Sessions</h2>
              <p className="hidden lg:block text-sm text-[#555] mb-8">Track your progress with your assigned mentors.</p>
              <EmptyState
                icon={
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
                title="No sessions scheduled"
                subtitle="Your mentor session history and upcoming appointments will appear here."
              />
            </div>
          </main>

        /* ── Chat ── */
        ) : (
          <main className="flex-1 flex flex-col overflow-hidden relative">
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
            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 lg:px-4">
              <div className="max-w-2xl mx-auto min-h-full flex flex-col">
                {/* Top spacer — bottom-anchors short threads on mobile only */}
                <div className="flex-1 min-h-4 lg:hidden" />
              <div className="space-y-5 lg:space-y-6 py-4 lg:py-5">
                {(() => {
                  const activeYoutube = selectedTranscript
                    ? transcriptList.find((t) => t.title === selectedTranscript)?.youtube
                    : undefined;
                  const activeParsed = selectedTranscript ? parsePodcast(selectedTranscript) : null;
                  const activeSpeaker = activeParsed?.speaker ?? "Podcast";
                  const activeTopic = activeParsed?.topic ?? selectedTranscript ?? "";
                  const activeVideoId = activeYoutube ? getYouTubeId(activeYoutube) : null;
                  const firstAssistantIdx = messages.findIndex((msg) => msg.role === "assistant");
                  return messages.map((m, msgIdx) => {
                    // Extract text once — reused for render + copy
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const msgText = (m.parts as any[]).filter((p) => p.type === "text").map((p) => p.text as string).join("");
                    return (
                    <div key={m.id} className="flex flex-col gap-2">
                      {/* Message bubble */}
                      <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        {m.role === "assistant" && (
                          <div className="w-7 h-7 rounded-full flex-shrink-0 mr-3 mt-0.5 flex items-center justify-center flex-none overflow-hidden">
                            <img src="/logo.png" alt="SOM" className="w-7 h-7 object-contain select-none pointer-events-none" />
                          </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-[#3a3a3a] text-[#ececec] rounded-br-sm"
                            : "text-[#ececec]"
                        }`}>
                          {m.role === "assistant" ? (
                            <MarkdownContent content={msgText} />
                          ) : (
                            msgText
                          )}
                        </div>
                      </div>

                      {/* Copy action — shown below every assistant message */}
                      {m.role === "assistant" && (() => {
                        return (
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
                        );
                      })()}

                      {/* Source pill — shown once only, below the first assistant response */}
                      {m.role === "assistant" && activeYoutube && msgIdx === firstAssistantIdx && (
                        <div className="ml-10 flex items-center gap-2">
                          <div className="relative inline-block group/src">
                          {/* Hover preview card — fully clickable */}
                          <a
                            href={activeYoutube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-full left-0 mb-2 w-60 opacity-0 group-hover/src:opacity-100 translate-y-1 group-hover/src:translate-y-0 transition-all duration-200 pointer-events-none group-hover/src:pointer-events-auto z-50 block"
                          >
                            <div className="bg-[#1c1c1c] border border-[#333] rounded-xl shadow-2xl overflow-hidden hover:border-[#444] transition-colors">
                              {activeVideoId && (
                                <img
                                  src={`https://img.youtube.com/vi/${activeVideoId}/mqdefault.jpg`}
                                  alt=""
                                  className="w-full aspect-video object-cover"
                                />
                              )}
                              <div className="p-3">
                                <p className="text-[10px] font-semibold text-[#890B0F] uppercase tracking-widest mb-1">{activeSpeaker}</p>
                                <p className="text-xs text-[#d0d0d0] leading-snug mb-2.5 line-clamp-2">{activeTopic}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-[#555]">
                                  <svg className="w-2.5 h-2.5 text-[#890B0F]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                  </svg>
                                  Watch on YouTube →
                                </div>
                              </div>
                            </div>
                          </a>
                          {/* Pill */}
                          <a
                            href={activeYoutube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1c1c1c] border border-[#272727] hover:border-[#383838] hover:bg-[#212121] transition-all duration-150"
                          >
                            <svg className="w-2.5 h-2.5 text-[#890B0F] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            <span className="text-[10px] text-[#555] group-hover/src:text-[#888] transition-colors font-medium">
                              YouTube
                            </span>
                          </a>
                        </div>
                        </div>
                      )}
                    </div>
                  );
                  });
                })()}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 mr-3 mt-0.5 flex items-center justify-center flex-none overflow-hidden">
                      <img src="/logo.png" alt="SOM" className="w-7 h-7 object-contain select-none pointer-events-none" />
                    </div>
                    <div className="py-3.5 flex items-center gap-[5px]">
                      <span className="typing-dot w-[7px] h-[7px] rounded-full bg-[#555]" style={{ animationDelay: "0s" }} />
                      <span className="typing-dot w-[7px] h-[7px] rounded-full bg-[#555]" style={{ animationDelay: "0.18s" }} />
                      <span className="typing-dot w-[7px] h-[7px] rounded-full bg-[#555]" style={{ animationDelay: "0.36s" }} />
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
  );
}
