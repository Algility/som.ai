"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const ALLOWED_TYPES = ["email", "signup", "recovery", "magiclink"] as const;

function safeNext(path: string | null): string {
  const p = (path ?? "").trim();
  if (!p.startsWith("/") || p.startsWith("//")) return "/";
  return p;
}

export default function AuthConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string>("Confirming…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.replace("/login?error=config");
      return;
    }

    const run = async () => {
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
      const search = typeof window !== "undefined" ? window.location.search : "";
      const params = new URLSearchParams(hash || search);
      const next = safeNext(params.get("next"));

      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) {
          router.replace(`/login?error=verify_failed`);
          return;
        }
        router.replace(next);
        return;
      }

      const token_hash = params.get("token_hash") ?? params.get("token");
      const typeParam = params.get("type");
      if (
        token_hash &&
        typeParam &&
        ALLOWED_TYPES.includes(typeParam as (typeof ALLOWED_TYPES)[number])
      ) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type: typeParam as "email" | "signup" | "recovery" | "magiclink",
          token_hash,
        });
        if (verifyError) {
          router.replace("/login?error=verify_failed");
          return;
        }
        router.replace(next);
        return;
      }

      setError("Confirmation link is invalid or incomplete.");
      setMessage("");
    };

    run();
  }, [router]);

  const rightPanel = (
    <div className="hidden lg:flex flex-1 min-h-svh flex-col items-center justify-center gap-3 bg-[#141414] p-8 flex-shrink-0">
      <Link href="/" className="focus-visible:outline-none focus-visible:ring-0 rounded-lg no-underline">
        <img src="/logo.png" alt="School of Mentors" className="w-56 h-56 object-contain select-none drop-shadow-none pointer-events-none" width={224} height={224} draggable={false} />
      </Link>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-svh flex bg-[#1a1a1a]">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 px-4 pt-safe-area pb-1.5">
            <Link href="/login" className="inline-flex items-center gap-2 transition-colors duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]" aria-label="Back to login">
              <img src="/logo.png" alt="" className="h-11 w-auto object-contain select-none pointer-events-none" width={44} height={44} draggable={false} />
              <span className="text-base font-brand text-[#ececec] tracking-tight select-none">School of Mentors AI</span>
            </Link>
          </div>
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 p-6">
            <p className="text-base text-[#e07c7c] text-center" role="alert" aria-live="polite">{error}</p>
            <Link href="/login" className="text-base text-[#a3a3a3] hover:text-[#ececec] transition-colors duration-150 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] rounded">
              Back to login
            </Link>
          </div>
        </div>
        {rightPanel}
      </div>
    );
  }

  return (
    <div className="min-h-svh flex bg-[#1a1a1a]">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 px-4 pt-safe-area pb-1.5">
          <Link href="/" className="inline-flex items-center gap-2 transition-colors duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]" aria-label="Home">
            <img src="/logo.png" alt="" className="h-11 w-auto object-contain select-none pointer-events-none" width={44} height={44} draggable={false} />
            <span className="text-base font-brand text-[#ececec] tracking-tight select-none">School of Mentors AI</span>
          </Link>
        </div>
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 p-6" role="status" aria-live="polite">
          <div className="w-8 h-8 rounded-full border-2 border-[#404040] border-t-[#b5b5b5] animate-spin" aria-hidden />
          <p className="text-base text-[#a3a3a3]">{message}</p>
        </div>
      </div>
      {rightPanel}
    </div>
  );
}
