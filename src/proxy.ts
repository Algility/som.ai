/**
 * Next.js 16+ edge proxy (replaces deprecated `middleware.ts` for this app).
 *
 * Keep `export const config` in THIS file only. Do not add `src/middleware.ts` that does
 * `export { config } from "@/proxy"` — Next.js rejects re-exported `config` and will error at build/runtime.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as { path?: string })
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user && path === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!user && path === "/onboarding") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && (path === "/login" || path === "/forgot-password")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  const hasName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  if (user && path === "/" && !hasName) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  if (user && path === "/onboarding" && hasName) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
