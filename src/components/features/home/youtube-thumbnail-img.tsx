"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

/**
 * YouTube sometimes returns a 120×90 grey "missing" image for maxresdefault
 * (and sometimes others) at HTTP 200, so onError never fires. We detect the
 * placeholder in onLoad via naturalWidth and step down to the next tier.
 */
const YOUTUBE_THUMB_QUALITIES = [
  "maxresdefault",
  "sddefault",
  "hqdefault",
  "mqdefault",
  "default",
  "0",
] as const;
const YOUTUBE_THUMB_HOSTS = ["https://img.youtube.com", "https://i.ytimg.com"] as const;

type ThumbQuality = (typeof YOUTUBE_THUMB_QUALITIES)[number];

function isPlaceholder(quality: ThumbQuality, naturalWidth: number): boolean {
  if (naturalWidth > 130) return false;
  return quality !== "default" && quality !== "0";
}

interface YouTubeThumbnailImgProps {
  videoId: string;
  className?: string;
}

export function YouTubeThumbnailImg({ videoId, className }: YouTubeThumbnailImgProps) {
  const [tier, setTier] = useState(0);
  const [hostIndex, setHostIndex] = useState(0);

  const i = Math.min(tier, YOUTUBE_THUMB_QUALITIES.length - 1);
  const quality = YOUTUBE_THUMB_QUALITIES[i];
  const host = YOUTUBE_THUMB_HOSTS[hostIndex] ?? YOUTUBE_THUMB_HOSTS[0];
  const src = `${host}/vi/${videoId}/${quality}.jpg`;

  const tryNextHostOrTier = useCallback(() => {
    setHostIndex((h) => {
      if (h === 0) return 1;
      setTier((t) => (t < YOUTUBE_THUMB_QUALITIES.length - 1 ? t + 1 : t));
      return 0;
    });
  }, []);

  return (
    <Image
      key={`${videoId}-q${i}-h${hostIndex}`}
      src={src}
      alt=""
      width={1280}
      height={720}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      unoptimized
      onLoad={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        const w = img.naturalWidth;
        if (w === 0) return;
        if (isPlaceholder(quality, w)) tryNextHostOrTier();
      }}
      onError={tryNextHostOrTier}
    />
  );
}
