"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import type { ChatHistoryItem, ChatView } from "@/types/chat";
import { NavItem } from "@/components/features/home/nav-item";
import { SidebarToggleIcon } from "@/components/features/home/sidebar-toggle-icon";
import { LockedNavItem } from "@/components/features/home/locked-nav-item";
import { CtaButtons } from "@/components/features/home/cta-buttons";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  view: ChatView;
  hasMessages: boolean;
  onViewChange: (v: ChatView) => void;
  chatHistory: ChatHistoryItem[];
  activeChatId: string | null;
  user: User | null;
  avatarUrl: string | null;
  initials: string;
  profileDisplayName: string;
  onNewChat: () => void;
  onRestoreChat: (item: ChatHistoryItem) => void;
  onRequestDelete: (id: string) => void;
  onRequestRename: (id: string, title: string) => void;
  onOpenTutorial: () => void;
  onOpenCommandPalette: () => void;
}

export function Sidebar({
  open, onClose, view, hasMessages, onViewChange, chatHistory, activeChatId,
  user, avatarUrl, initials, profileDisplayName,
  onNewChat, onRestoreChat, onRequestDelete, onRequestRename,
  onOpenTutorial, onOpenCommandPalette,
}: SidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const filtered = searchQuery.trim()
    ? chatHistory.filter((h) => h.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatHistory;

  const handleNav = useCallback((targetView: ChatView) => {
    onViewChange(targetView);
    if (window.innerWidth < 1024) onClose();
  }, [onViewChange, onClose]);

  return (
    <aside className={`flex h-svh flex-col overflow-hidden bg-[#181818] border-r border-[#403F3D] transition-[transform,width] duration-300 ease-in-out will-change-transform fixed inset-y-0 left-0 z-50 w-[260px] lg:sticky lg:top-0 lg:relative lg:z-auto lg:flex-shrink-0 ${open ? "translate-x-0 lg:w-[260px]" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0"}`}>
      <div className="flex flex-col h-full w-[260px] min-h-0 overflow-visible">

        <div className="flex items-center justify-between px-4 pb-1 pt-safe-area-lg lg:pt-4">
          <button type="button" onClick={() => onViewChange("home")} className="text-left" aria-label="Go to home">
            <span className="text-lg lg:text-xl font-brand text-[#ececec] tracking-tight select-none">School of Mentors AI</span>
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#666] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors cursor-pointer" aria-label="Close sidebar">
            <SidebarToggleIcon />
          </button>
        </div>

        <div className="px-3 py-1 space-y-0.5">
          <button onClick={onNewChat} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors cursor-pointer">
            <span className="w-4 h-4 flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg></span>
            <span className="flex-1 text-left">New chat</span>
          </button>
          {searchOpen ? (
            <div className="px-0 py-0.5">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#242424] border border-[#383838]">
                <svg className="w-4 h-4 text-[#555] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } }}
                  placeholder="Search conversations…" className="flex-1 bg-transparent text-sm text-[#ececec] placeholder-[#444] outline-none" />
                <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-[#444] hover:text-[#888] transition-colors cursor-pointer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ) : (
            <NavItem label="Search" onClick={onOpenCommandPalette} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>} />
          )}
        </div>

        <div className="px-3 space-y-0.5">
          <NavItem active={view === "home" || view === "chat"} onClick={() => handleNav(hasMessages ? "chat" : "home")} label="Chats"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>} />
          <LockedNavItem label="Mentorship Calls" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
          <LockedNavItem label="Call Recordings" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.91 6.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>} />
          <NavItem onClick={() => { onOpenTutorial(); if (window.innerWidth < 1024) onClose(); }} label="How to use"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>} />
        </div>

        <div className="mt-2 min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-contain px-3">
          <p className="text-xs text-[#555] px-2 py-1.5 font-medium uppercase tracking-wider">Recents</p>
          <div className="space-y-0.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-[#3a3a3a] px-3 py-2">{searchQuery.trim() ? `No results for "${searchQuery}"` : "No conversations yet"}</p>
            ) : filtered.slice(0, 10).map((item) => (
              <div key={item.id} className="relative group">
                <button onClick={() => onRestoreChat(item)} className="w-full text-left px-3 py-2 pr-8 rounded-lg text-sm text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors truncate cursor-pointer" title={item.title ?? "New chat"}>
                  {item.title ?? "New chat"}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item.id ? null : item.id); }}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all cursor-pointer ${openMenuId === item.id ? "opacity-100 text-[#ececec] bg-[#333]" : "opacity-0 group-hover:opacity-100 text-[#666] hover:text-[#ececec] hover:bg-[#333]"}`}
                  aria-label="Chat options">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
                </button>
                {openMenuId === item.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                    <div className="absolute right-1 top-full mt-1 w-40 bg-[#2a2a2a] border border-[#383838] rounded-xl shadow-2xl overflow-hidden z-50 py-1">
                      <button onClick={() => { onRequestRename(item.id, item.title ?? ""); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#ccc] hover:text-[#ececec] hover:bg-[#333] transition-colors cursor-pointer">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Rename
                      </button>
                      <button onClick={() => { onRequestDelete(item.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-[#333] transition-colors cursor-pointer">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 px-3 pb-2 pt-1"><CtaButtons /></div>

        <div className="h-px bg-[#403F3D] flex-shrink-0" />
        <div className="px-2 pb-3 pt-1.5 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5">
            {avatarUrl ? (
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-[#404040] bg-[#333]">
                <Image src={avatarUrl} alt="" width={36} height={36} className="w-full h-full object-cover" unoptimized />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#333] border border-[#404040] flex items-center justify-center text-[#ececec] text-sm font-semibold flex-shrink-0">{initials}</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#ececec] font-medium truncate">{profileDisplayName}</p>
              <p className="text-xs text-[#737373] truncate select-none">School of Mentors AI</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
