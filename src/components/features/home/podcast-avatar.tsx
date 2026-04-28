"use client";

import Image from "next/image";
import { useState } from "react";

const SPEAKER_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

interface PodcastAvatarProps {
  speaker: string | null;
  initials: string;
}

export function PodcastAvatar({ speaker, initials }: PodcastAvatarProps) {
  const [extIndex, setExtIndex] = useState(0);
  const ext = SPEAKER_EXTENSIONS[extIndex];
  const src = speaker ? `/speakers/${speaker}.${ext}` : null;
  const failed = extIndex >= SPEAKER_EXTENSIONS.length;

  if (src && !failed) {
    return (
      <Image
        src={src}
        alt={speaker ?? ""}
        width={36}
        height={36}
        className="w-full h-full object-cover object-top"
        onError={() => setExtIndex((i) => i + 1)}
        unoptimized
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-base font-semibold text-[#666]">
      {initials}
    </div>
  );
}
