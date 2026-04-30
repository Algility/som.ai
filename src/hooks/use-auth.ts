"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

const SESSION_CHECK_TIMEOUT_MS = 4_000;
const AUTH_REQUEST_TIMEOUT_MS = 15_000;

function isInvalidRefreshTokenError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const message = (err as { message?: string })?.message ?? "";
  return code === "refresh_token_not_found" || /refresh token/i.test(message);
}

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

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
    const clearInvalidSession = () => {
      void supabase.auth.signOut({ scope: "local" });
      setSession(null);
      setUser(null);
      setLoading(false);
    };
    const sessionPromise = supabase.auth
      .getSession()
      .then(async ({ data: { session: s }, error }) => {
        if (error && isInvalidRefreshTokenError(error)) {
          clearInvalidSession();
          return;
        }
        if (s) {
          setSession(s);
          setUser(s.user);
        } else {
          // No session — sign in anonymously so every visitor gets a stable user_id
          const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
          if (!anonError && anonData.session) {
            setSession(anonData.session);
            setUser(anonData.session.user);
          }
        }
      })
      .catch((err) => {
        if (isInvalidRefreshTokenError(err)) clearInvalidSession();
      });
    const timeoutPromise = new Promise<void>((resolve) =>
      setTimeout(resolve, SESSION_CHECK_TIMEOUT_MS)
    );
    Promise.race([sessionPromise, timeoutPromise]).finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (event === "SIGNED_OUT" || !s) setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        AUTH_REQUEST_TIMEOUT_MS,
        "Connection timed out. Check your network and try again."
      );
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
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/confirm`,
            data: full_name ? { full_name } : undefined,
          },
        }),
        AUTH_REQUEST_TIMEOUT_MS,
        "Connection timed out. Check your network and try again."
      );
      if (error) throw error;
      return data;
    },
    [supabase]
  );

  const resetPasswordForEmail = useCallback(
    async (email: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/confirm?next=/login`,
        }),
        AUTH_REQUEST_TIMEOUT_MS,
        "Connection timed out. Check your network and try again."
      );
      if (error) throw error;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut({ scope: "local" });
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
