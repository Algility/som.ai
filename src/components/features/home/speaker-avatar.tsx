"use client";

import Image from "next/image";
import { useState } from "react";

const SPEAKER_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

interface SpeakerAvatarProps {
  speaker: string | null;
  initials: string;
}

export function SpeakerAvatar({ speaker, initials }: SpeakerAvatarProps) {
  const [extIndex, setExtIndex] = useState(0);
  const ext = SPEAKER_EXTENSIONS[extIndex];
  const src = speaker ? `/speakers/${speaker}.${ext}` : null;
  const failed = extIndex >= SPEAKER_EXTENSIONS.length;

  if (src && !failed) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-[#2a2a2a]">
        <Image
          src={src}
          alt={speaker ?? ""}
          width={36}
          height={36}
          className="w-full h-full object-cover object-top"
          onError={() => setExtIndex((i) => i + 1)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-[#2a2a2a] group-hover:bg-[#333] flex items-center justify-center text-xs font-semibold text-[#888] flex-shrink-0 transition-colors">
      {initials}
    </div>
  );
}
