"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { marked } from "marked";
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
  const profileRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  const userName = "Joel";

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const isLoading = status === "streaming" || status === "submitted";

  // Open sidebar by default on desktop only
  useEffect(() => {
    if (window.innerWidth >= 1024) setSidebarOpen(true);
  }, []);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  return (
    <div className="h-screen w-full bg-[#1a1a1a] flex font-sans overflow-hidden">

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        h-screen flex flex-col overflow-hidden
        bg-[#181818] border-r border-[#403F3D]
        transition-all duration-300 ease-in-out
        fixed inset-y-0 left-0 z-50 w-[260px]
        lg:sticky lg:top-0 lg:relative lg:z-auto lg:flex-shrink-0
        ${sidebarOpen
          ? "translate-x-0 lg:w-[260px]"
          : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0"
        }`}>

        <div className="flex flex-col h-full w-[260px] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-1">
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
            <NavItem label="Search" icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            } />
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
              {transcriptList.slice(0, 5).map(({ title }) => {
                const { speaker, topic } = parsePodcast(title);
                const label = speaker ? `${speaker} — ${topic}` : title;
                return (
                  <button
                    key={title}
                    onClick={() => { handleSelectPodcast(title); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors truncate cursor-pointer"
                    title={title}
                  >
                    {label}
                  </button>
                );
              })}
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fcfcf9] dark:bg-[#1a1a1a] transition-colors duration-200 relative">

        {/* ── Mobile top bar (shown when sidebar is closed, hidden on home view) ── */}
        {!sidebarOpen && view !== "home" && (
          <div className="relative flex items-center px-2 py-3 lg:hidden flex-shrink-0">
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

            {/* Right: spacer to balance the toggle on the left */}
            <div className="ml-auto w-9" />
          </div>
        )}

        {/* ── Home view: floating sidebar toggle (absolute, top-left) ── */}
        {!sidebarOpen && view === "home" && (
          <div className="absolute top-3 left-3 z-10 lg:hidden">
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
          <main className="flex-1 flex flex-col items-center justify-center px-4 pb-6 lg:pb-16">
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

            <ClaudeChatInput onSendMessage={handleSendMessage} />

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
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 lg:px-4 py-4 lg:py-6">
              <div className="max-w-2xl mx-auto space-y-5 lg:space-y-6">
                {(() => {
                  const activeYoutube = selectedTranscript
                    ? transcriptList.find((t) => t.title === selectedTranscript)?.youtube
                    : undefined;
                  const activeParsed = selectedTranscript ? parsePodcast(selectedTranscript) : null;
                  const activeSpeaker = activeParsed?.speaker ?? "Podcast";
                  const activeTopic = activeParsed?.topic ?? selectedTranscript ?? "";
                  const activeVideoId = activeYoutube ? getYouTubeId(activeYoutube) : null;
                  const firstAssistantIdx = messages.findIndex((msg) => msg.role === "assistant");
                  return messages.map((m, msgIdx) => (
                    <div key={m.id} className="flex flex-col gap-2">
                      {/* Message bubble */}
                      <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        {m.role === "assistant" && (
                          <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 mr-3 mt-0.5">
                            <img src="/logo.png" alt="SOM" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-[#2a2a2a] text-[#ececec] rounded-br-sm"
                            : "text-[#ececec]"
                        }`}>
                          {m.role === "assistant" ? (
                            <div
                              className="markdown-body text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: marked(
                                  m.parts.filter((p: {type: string}) => p.type === "text").map((p: {type: string; text: string}) => p.text).join("")
                                ) as string,
                              }}
                            />
                          ) : (
                            m.parts.filter((p: {type: string}) => p.type === "text").map((p: {type: string; text: string}) => p.text).join("")
                          )}
                        </div>
                      </div>

                      {/* Source pill — shown once only, below the first assistant response */}
                      {m.role === "assistant" && activeYoutube && msgIdx === firstAssistantIdx && (
                        <div className="ml-14 flex items-center gap-2">
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
                  ));
                })()}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 mr-3 mt-0.5">
                      <img src="/logo.png" alt="SOM" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-[#666] text-sm py-3">
                      <span className="animate-pulse">···</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat input */}
            <div className="px-2 lg:px-4 pb-4 lg:pb-6 pt-2 flex-shrink-0">
              <div className="max-w-2xl mx-auto">
                <ClaudeChatInput onSendMessage={handleSendMessage} />
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
