"use client";

import { useEffect } from "react";

interface FullscreenErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  subtitle?: string;
}

/** Full-bleed error fallback used by `error.tsx` across route segments. */
export function FullscreenError({
  error,
  reset,
  title = "Something went wrong",
  subtitle = "We hit an error. You can try again or go back.",
}: FullscreenErrorProps) {
  useEffect(() => {
    // Surface to browser DevTools — keep Sentry/reporting integration elsewhere.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-[#1a1a1a] p-6">
      <h1 className="text-xl font-semibold text-[#ececec]">{title}</h1>
      <p className="text-sm text-[#a3a3a3] text-center max-w-sm">{subtitle}</p>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-[#2a2a2a] text-[#ececec] text-sm font-medium hover:bg-[#333] transition-colors"
      >
        Try again
      </button>
      <a
        href="/"
        className="text-sm text-[#737373] hover:text-[#a3a3a3] transition-colors"
      >
        Back to home
      </a>
    </div>
  );
}
