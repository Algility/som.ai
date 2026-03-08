import { createServerClient } from "@supabase/ssr";

type CookieGetter = () => { name: string; value: string }[];
type CookieSetter = (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void;

export function createServerSupabaseClient(options: { getAll: CookieGetter; setAll: CookieSetter }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createServerClient(url, key, {
    cookies: {
      getAll: options.getAll,
      setAll: options.setAll,
    },
  });
}
