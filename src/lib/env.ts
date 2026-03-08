/**
 * Server-side env access. Returns null when missing so callers can degrade gracefully.
 */
export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getAnthropicApiKey(): string | null {
  return process.env.ANTHROPIC_API_KEY ?? null;
}
