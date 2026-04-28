"use client";

import type { ReactNode } from "react";

interface NavItemProps {
  icon: ReactNode;
  label: string;
  right?: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function NavItem({ icon, label, right, active, onClick }: NavItemProps) {
  const state = active
    ? "text-[#ececec] bg-[#2a2a2a]"
    : "text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#2a2a2a]";
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${state}`}
    >
      <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {right && <span className="ml-auto">{right}</span>}
    </button>
  );
}
