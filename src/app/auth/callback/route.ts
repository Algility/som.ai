import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { parseCookieHeader } from "@/lib/cookies";

function safeRedirectPath(path: string | null): string {
  const p = (path ?? "").trim();
  if (!p.startsWith("/") || p.startsWith("//")) return "/";
  return p;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  const response = NextResponse.redirect(new URL(next, origin), { status: 302 });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie"));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { path: "/", ...options } as { path?: string })
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }
  return response;
}
