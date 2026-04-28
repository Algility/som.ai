"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";

interface LockedNavItemProps {
  icon: ReactNode;
  label: string;
}

/**
 * A sidebar nav item gated behind School of Mentors membership. The row is
 * a real anchor that opens the Skool community in a new tab. No tooltip for
 * now — the lock icon + muted text signal the gated state, and the click
 * takes the user straight to the upgrade page.
 */
const SKOOL_URL =
  process.env.NEXT_PUBLIC_SKOOL_URL ??
  "https://www.skool.com/schoolofmentors/about";

export function LockedNavItem({ icon, label }: LockedNavItemProps) {
  return (
    <a
      href={SKOOL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#6a6a6a] transition-colors hover:bg-[#222] hover:text-[#a3a3a3]"
      title="School of Mentors Members only"
    >
      <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <Lock
        className="w-3 h-3 flex-shrink-0 text-[#5a5a5a] transition-colors group-hover:text-[#8a8a8a]"
        strokeWidth={2}
      />
    </a>
  );
}
