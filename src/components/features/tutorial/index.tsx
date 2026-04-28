"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { hasSeenTutorial, markTutorialSeen } from "@/services/tutorial";
import { TutorialModal } from "./tutorial-modal";
import type { TutorialAction } from "./tutorial-slides";

const FORCE_PARAM = "showTutorial";

/** Imperative API exposed by `<Tutorial />` via ref. */
export interface TutorialHandle {
  open: () => void;
}

export interface TutorialProps {
  /** Called when the user clicks an in-slide action button. */
  onAction?: (action: TutorialAction) => void;
}

type OpenMode = "auto" | "forced" | "manual";

/**
 * First-run walkthrough + always-available tutorial modal.
 *
 * - Auto-shows once for any logged-in user whose `user_metadata.tutorial_seen`
 *   is not true. Closing marks it seen.
 * - Can be opened imperatively at any time via a ref: `ref.current?.open()`.
 *   Manual opens do NOT re-write the `tutorial_seen` flag.
 * - Can be force-opened via `?showTutorial=1` in the URL. Closing strips the
 *   param without touching user metadata.
 */
export const Tutorial = forwardRef<TutorialHandle, TutorialProps>(
  function Tutorial({ onAction }, ref) {
    const { user, loading } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [openMode, setOpenMode] = useState<OpenMode | null>(null);

    useEffect(() => setMounted(true), []);

    // Auto-open: either first-run for this user, or forced via query param.
    useEffect(() => {
      if (typeof window === "undefined") return;
      const forced =
        new URLSearchParams(window.location.search).get(FORCE_PARAM) === "1";
      if (forced) {
        setOpenMode("forced");
        return;
      }
      if (loading || !user) return;
      if (hasSeenTutorial(user)) return;
      setOpenMode("auto");
    }, [loading, user]);

    useImperativeHandle(
      ref,
      () => ({
        open: () =>
          setOpenMode((prev) => (prev === null ? "manual" : prev)),
      }),
      []
    );

    const handleDone = useCallback(() => {
      const mode = openMode;
      setOpenMode(null);

      if (mode === "auto") {
        const client = createClient();
        if (!client) return;
        markTutorialSeen(client).catch(() => {
          /* Non-blocking: tutorial is client-visual only. */
        });
        return;
      }

      if (mode === "forced") {
        // Strip the override so a reload doesn't reopen the modal.
        const url = new URL(window.location.href);
        url.searchParams.delete(FORCE_PARAM);
        window.history.replaceState(null, "", url.toString());
      }
      // "manual" mode: just close — metadata already marked, no-op.
    }, [openMode]);

    if (!mounted || openMode === null) return null;
    return createPortal(
      <TutorialModal onDone={handleDone} onAction={onAction} />,
      document.body
    );
  }
);
