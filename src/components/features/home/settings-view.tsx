"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { uploadAvatar, removeAvatar, isBucketMissingError, MISSING_AVATAR_BUCKET_MESSAGE } from "@/services/avatar";

interface SettingsViewProps {
  user: User | null;
  initials: string;
  profileDisplayName: string;
}

export function SettingsView({ user, initials, profileDisplayName }: SettingsViewProps) {
  const avatarUrl = (user?.user_metadata?.avatar_url as string) || null;
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user?.id) return;
    if (!file.type.startsWith("image/")) { setAvatarError("Please choose an image file."); return; }
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const client = createClient();
      if (!client) throw new Error("Not configured");
      await uploadAvatar(client, user.id, file);
    } catch (err) {
      setAvatarError(isBucketMissingError(err) ? MISSING_AVATAR_BUCKET_MESSAGE : err instanceof Error ? err.message : "Failed to update photo.");
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

  return (
    <main className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 pb-safe pt-5 lg:px-6 lg:pb-8 lg:pt-8">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-brand-sub text-[#ececec] mb-1">Settings</h2>
        <p className="text-sm text-[#555] mb-8">Manage your account and preferences.</p>
        <section className="rounded-2xl bg-[#1c1c1c] border border-[#272727] overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-[#272727]"><h3 className="text-sm font-semibold text-[#ececec]">Account</h3></div>
          <div className="p-4 space-y-5">
            <div className="flex items-center gap-4">
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <button type="button" disabled={avatarUploading}
                onClick={() => { if (avatarInputRef.current) { avatarInputRef.current.value = ""; avatarInputRef.current.click(); } }}
                className="flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#890B0F] focus:ring-offset-2 focus:ring-offset-[#1c1c1c] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label={avatarUploading ? "Uploading…" : "Change profile photo"}>
                {avatarUrl ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-[#383838] bg-[#2a2a2a] ring-2 ring-transparent hover:ring-[#383838] transition-all">
                    <Image src={avatarUrl} alt="" width={64} height={64} className="w-full h-full object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#333] border border-[#404040] flex items-center justify-center text-[#ececec] text-xl font-semibold ring-2 ring-transparent hover:ring-[#383838] transition-all">{initials}</div>
                )}
              </button>
              {avatarUrl && <button type="button" disabled={avatarUploading} onClick={handleAvatarRemove} className="text-sm text-[#737373] hover:text-[#a3a3a3] disabled:opacity-50 transition-colors cursor-pointer">{avatarUploading ? "…" : "Remove photo"}</button>}
              {avatarError && <p className="text-xs text-red-400">{avatarError}</p>}
            </div>
            <div className="h-px bg-[#272727]" />
            <div><p className="text-xs font-medium text-[#737373] uppercase tracking-wider mb-1">Email</p><p className="text-sm text-[#d4d4d4]">{user?.email ?? "—"}</p></div>
            <div><p className="text-xs font-medium text-[#737373] uppercase tracking-wider mb-1">Name</p><p className="text-sm text-[#d4d4d4]">{profileDisplayName}</p></div>
          </div>
        </section>
        <section className="rounded-2xl bg-[#1c1c1c] border border-[#272727] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#272727]"><h3 className="text-sm font-semibold text-[#ececec]">Support</h3></div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-[#a3a3a3]">Need help? Reach out to the School of Mentors team.</p>
            <a href="mailto:somai@schoolofmentors.com" className="inline-flex items-center gap-2 text-sm text-[#ececec] hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              somai@schoolofmentors.com
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
