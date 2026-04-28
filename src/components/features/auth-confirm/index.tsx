"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AuthSplitLayout } from "@/components/layouts/auth-split-layout";
import { confirmAuthFromParams } from "@/services/auth-confirm";

export function AuthConfirmFlow() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.replace("/login?error=config");
      return;
    }

    const hash = window.location.hash.slice(1);
    const search = window.location.search;
    const params = new URLSearchParams(hash || search);

    confirmAuthFromParams({ supabase, params })
      .then((result) => {
        if (result.kind === "redirect") {
          router.replace(result.to);
        } else {
          setError(result.message);
        }
      })
      .catch(() => {
        setError("Something went wrong while confirming your link.");
      });
  }, [router]);

  if (error) {
    return <ConfirmErrorView message={error} />;
  }

  return <ConfirmLoadingView />;
}

function ConfirmLoadingView() {
  return (
    <AuthSplitLayout headerHref="/" headerAriaLabel="Home">
      <main
        className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 p-6"
        role="status"
        aria-live="polite"
        aria-label="Confirming your account"
        aria-busy="true"
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-[#404040] border-t-[#b5b5b5] animate-spin"
          aria-hidden
        />
        <p className="text-base text-[#a3a3a3]">Confirming…</p>
        <p className="text-sm text-[#737373]">This may take a moment.</p>
      </main>
    </AuthSplitLayout>
  );
}

interface ConfirmErrorViewProps {
  message: string;
}

function ConfirmErrorView({ message }: ConfirmErrorViewProps) {
  return (
    <AuthSplitLayout headerHref="/login" headerAriaLabel="Back to login">
      <main
        className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
        aria-label="Confirmation error"
      >
        <p className="text-base text-[#e07c7c]" role="alert" aria-live="assertive">
          {message}
        </p>
        <p className="text-sm text-[#a3a3a3]">
          If your link expired, request a new one from the login page.
        </p>
        <Link
          href="/login"
          className="text-base text-[#ececec] hover:text-white font-medium transition-colors duration-150 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] rounded"
        >
          Back to login
        </Link>
      </main>
    </AuthSplitLayout>
  );
}
