"use client";

import { FullscreenError } from "@/components/layouts/fullscreen-error";

export default function AuthConfirmError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <FullscreenError error={error} reset={reset} />;
}
