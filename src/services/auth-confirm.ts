import type { SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_TYPES = ["email", "signup", "recovery", "magiclink"] as const;
export type AllowedOtpType = (typeof ALLOWED_TYPES)[number];

/** Default redirect after signup/recovery confirm — the edge proxy then forwards to / if the user already has a name. */
export const DEFAULT_NEXT_AFTER_CONFIRM = "/onboarding";

export function safeNext(path: string | null): string {
  const p = (path ?? "").trim();
  if (!p.startsWith("/") || p.startsWith("//")) return "/";
  return p;
}

interface ConfirmInput {
  supabase: SupabaseClient;
  params: URLSearchParams;
}

export type ConfirmResult =
  | { kind: "redirect"; to: string }
  | { kind: "error"; message: string };

export async function confirmAuthFromParams({
  supabase,
  params,
}: ConfirmInput): Promise<ConfirmResult> {
  const nextParam = params.get("next");
  const next = nextParam ? safeNext(nextParam) : DEFAULT_NEXT_AFTER_CONFIRM;

  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) return { kind: "redirect", to: "/login?error=verify_failed" };
    return { kind: "redirect", to: next };
  }

  const token_hash = params.get("token_hash") ?? params.get("token");
  const typeParam = params.get("type");
  if (token_hash && typeParam && isAllowedType(typeParam)) {
    const { error } = await supabase.auth.verifyOtp({
      type: typeParam,
      token_hash,
    });
    if (error) return { kind: "redirect", to: "/login?error=verify_failed" };
    return { kind: "redirect", to: next };
  }

  return { kind: "error", message: "Confirmation link is invalid or incomplete." };
}

function isAllowedType(value: string): value is AllowedOtpType {
  return (ALLOWED_TYPES as readonly string[]).includes(value);
}
