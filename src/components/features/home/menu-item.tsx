"use client";

import type { ReactNode } from "react";

interface MenuItemProps {
  icon?: ReactNode;
  label: string;
  right?: ReactNode;
  danger?: boolean;
  onClick?: () => void;
}

export function MenuItem({ icon, label, right, danger, onClick }: MenuItemProps) {
  const state = danger
    ? "text-red-400 hover:bg-[#333]"
    : "text-[#ccc] hover:text-[#ececec] hover:bg-[#333]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${state}`}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0 opacity-70">{icon}</span>}
      <span className="flex-1 text-left">{label}</span>
      {right && <span className="text-[#555] text-xs ml-auto">{right}</span>}
    </button>
  );
}

export function MenuDivider() {
  return <div className="h-px bg-[#403F3D] my-1" />;
}
