"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface DeleteChatModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteChatModal({ onConfirm, onCancel }: DeleteChatModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#222] border border-[#383838] rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-[#ececec] mb-2">Delete chat</h2>
        <p className="text-sm text-[#888] mb-6">Are you sure you want to delete this chat?</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="min-h-[44px] px-4 py-2 rounded-lg text-sm text-[#ccc] border border-[#383838] hover:bg-[#2a2a2a] active:bg-[#333] transition-colors cursor-pointer touch-manipulation">
            Cancel
          </button>
          <button onClick={onConfirm} className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium bg-[#890B0D] hover:bg-[#a00e10] text-white transition-colors cursor-pointer touch-manipulation">
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
