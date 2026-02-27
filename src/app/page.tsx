"use client";

import React, { useState, useRef, useEffect } from "react";
import ClaudeChatInput from "@/components/ui/claude-style-chat-input";

const SidebarToggleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3V21M7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NavItem = ({ icon, label, right, active }: { icon: React.ReactNode; label: string; right?: React.ReactNode; active?: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
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

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  const userName = "Joel";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#fcfcf9] dark:bg-[#1a1a1a] flex font-sans transition-colors duration-200 overflow-hidden">

      {/* Sidebar */}
      <aside className={`flex-shrink-0 h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden
        bg-[#f0efe9] dark:bg-[#181818] border-r border-[#403F3D]
        ${sidebarOpen ? "w-[260px]" : "w-0 border-r-0"}`}>

        <div className="flex flex-col h-full w-[260px] overflow-hidden">

          {/* Sidebar header */}
          <div className="flex items-center justify-end px-3 pt-3 pb-1">
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
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#ececec] hover:bg-[#2a2a2a] transition-colors font-medium cursor-pointer">
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
            <NavItem active label="Chats" icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            } />
            <NavItem label="Call Recordings" icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.91 6.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            } />
            <NavItem label="Projects" icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            } />
          </div>

          {/* Recents */}
          <div className="flex-1 overflow-y-auto px-3 mt-2">
            <p className="text-xs text-[#555] px-2 py-1.5 font-medium uppercase tracking-wider">Recents</p>
            <div className="space-y-0.5">
              {["Call Recording — Sales Demo", "Mentor Session Notes", "Quick Questions"].map((item, i) => (
                <button key={i} className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors truncate cursor-pointer">
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* User profile */}
          <div className="h-px bg-[#403F3D]" />
          <div className={`px-3 pb-3 pt-2 relative cursor-pointer ${profileOpen ? "bg-[#2a2a2a]" : "hover:bg-[#222]"}`} ref={profileRef}>

            {/* Profile popup */}
            {profileOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#323232] rounded-xl shadow-2xl overflow-hidden py-1.5 z-50">
                {/* Email */}
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#fcfcf9] dark:bg-[#1a1a1a] transition-colors duration-200">

        {/* Top bar (only shows toggle when sidebar is closed) */}
        {!sidebarOpen && (
          <div className="fixed top-0 left-0 z-10 p-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-text-400 hover:text-text-200 hover:bg-bg-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <SidebarToggleIcon />
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 flex flex-col items-center justify-center p-4">

          {/* Greeting */}
          <div className="w-full max-w-3xl mb-8 sm:mb-12 text-center">
            <div className="w-fit mx-auto mb-4 animate-fade-up">
              <img
                src="/logo.png"
                alt="School of Mentors"
                className="w-44 h-44 object-contain [mix-blend-mode:multiply] dark:[mix-blend-mode:normal] select-none pointer-events-none"
                draggable={false}
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-light text-text-200 mb-3 tracking-tight animate-fade-up-delay">
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

          {/* Chat input */}
          <ClaudeChatInput onSendMessage={() => {}} />

          {/* Quick-action pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl mx-auto px-4">
            {["Call Recordings", "Mentor Sessions", "Projects", "Resources"].map((label, i) => (
              <button
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-300 bg-transparent border border-bg-300 dark:border-bg-300/50 rounded-full hover:bg-bg-200 hover:text-text-200 transition-colors duration-150 cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}
