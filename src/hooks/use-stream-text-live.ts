"use client";

import { useEffect, useRef, useState } from "react";

const STREAM_UPDATE_MS = 16;

/**
 * Show a live-streaming text as it arrives (like ChatGPT/Claude) while
 * throttling UI updates to ~60fps so markdown doesn't re-render every token.
 * No typewriter, no artificial pacing.
 */
export function useStreamTextLive(text: string, isStreaming: boolean): string {
  const [display, setDisplay] = useState(text);
  const ref = useRef(text);
  ref.current = text;

  useEffect(() => {
    if (!isStreaming) {
      setDisplay(text);
      return;
    }
    const id = setInterval(() => setDisplay(ref.current), STREAM_UPDATE_MS);
    return () => clearInterval(id);
  }, [isStreaming, text]);

  return isStreaming ? display : text;
}
