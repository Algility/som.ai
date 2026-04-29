"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface RenameChatModalProps {
  initialTitle: string;
  onConfirm: (title: string) => void;
  onCancel: () => void;
}

export function RenameChatModal({ initialTitle, onConfirm, onCancel }: RenameChatModalProps) {
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => { if (mounted) setTimeout(() => inputRef.current?.focus(), 50); }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#222] border border-[#383838] rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-[#ececec] mb-4">Rename chat</h2>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm(value);
            if (e.key === "Escape") onCancel();
          }}
          className="w-full px-3 py-2.5 rounded-lg bg-[#2a2a2a] border border-[#484848] text-sm text-[#ececec] outline-none focus:border-[#666] transition-colors mb-5"
          placeholder="Chat name"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-[#ccc] border border-[#383838] hover:bg-[#2a2a2a] transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={() => onConfirm(value)} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#ececec] hover:bg-white text-[#111] transition-colors cursor-pointer">
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
