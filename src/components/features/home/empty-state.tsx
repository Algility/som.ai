import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-xl bg-[#1c1c1c] border border-[#272727] flex items-center justify-center mb-4 text-[#555]">
        {icon}
      </div>
      <p className="text-sm font-medium text-[#a3a3a3] mb-1">{title}</p>
      <p className="text-xs text-[#737373] max-w-xs leading-relaxed">{subtitle}</p>
    </div>
  );
}
