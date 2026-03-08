"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);
  const requiresAuth = !!supabase;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, firstName?: string, lastName?: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const first = firstName?.trim();
      const last = lastName?.trim();
      const full_name = first && last ? `${first} ${last}` : first || undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/confirm`,
          data: full_name ? { full_name } : undefined,
        },
      });
      if (error) throw error;
      return data;
    },
    [supabase]
  );

  const resetPasswordForEmail = useCallback(
    async (email: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/confirm?next=/login`,
      });
      if (error) throw error;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error("Supabase not configured");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) throw error;
  }, [supabase]);

  return { user, session, loading, requiresAuth, signIn, signUp, signOut, signInWithGoogle, resetPasswordForEmail };
}
