"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface WelcomeModalProps {
  onSave: (name: string) => Promise<void>;
  onSkip: () => void;
}

export function WelcomeModal({ onSave, onSkip }: WelcomeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  if (!mounted) return null;

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#1c1c1c] border border-[#2e2e2e] rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center text-center">
        <div className="mb-5">
          <Image src="/logo.png" alt="SOM" width={56} height={56} className="w-14 h-14 object-contain" draggable={false} />
        </div>
        <h2 className="font-brand text-xl text-[#ececec] mb-1">What should we call you?</h2>
        <p className="text-sm text-[#666] mb-6">We'll use your name to personalise your experience.</p>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="Your first name"
          className="w-full px-4 py-3 rounded-xl bg-[#242424] border border-[#383838] text-sm text-[#ececec] placeholder-[#444] outline-none focus:border-[#555] transition-colors mb-3 text-center"
        />
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || saving}
          className="w-full py-3 rounded-xl bg-[#ececec] text-[#111] text-sm font-semibold hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mb-3"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
        <button onClick={onSkip} className="text-xs text-[#555] hover:text-[#888] transition-colors cursor-pointer">
          Skip for now
        </button>
      </div>
    </div>,
    document.body
  );
}
