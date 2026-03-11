"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-[#1a1a1a] p-6">
      <h1 className="text-xl font-semibold text-[#ececec]">Something went wrong</h1>
      <p className="text-sm text-[#a3a3a3] text-center max-w-sm">
        We hit an error. You can try again or go back.
      </p>
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
