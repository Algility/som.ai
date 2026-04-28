"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { TUTORIAL_SLIDES, type TutorialAction, type TutorialSlide } from "./tutorial-slides";

interface TutorialModalProps {
  onDone: () => void;
  onAction?: (action: TutorialAction) => void;
}

export function TutorialModal({ onDone, onAction }: TutorialModalProps) {
  const [index, setIndex] = useState(0);
  const slide = TUTORIAL_SLIDES[index];
  if (!slide) return null;

  const isLast = index >= TUTORIAL_SLIDES.length - 1;
  const isFirst = index === 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#383838] bg-[#1c1c1c] shadow-2xl">
        <CloseButton onDone={onDone} />
        <div className="px-7 pt-8 pb-6">
          <SlideBody
            key={index}
            slide={slide}
            onAction={(a) => {
              onAction?.(a);
              onDone();
            }}
          />
          <Dots count={TUTORIAL_SLIDES.length} activeIndex={index} />
          <NavButtons
            isFirst={isFirst}
            isLast={isLast}
            onBack={() => setIndex((i) => Math.max(0, i - 1))}
            onNext={() => setIndex((i) => i + 1)}
            onDone={onDone}
          />
        </div>
      </div>
    </div>
  );
}

interface SlideBodyProps {
  slide: TutorialSlide;
  onAction: (action: TutorialAction) => void;
}

function SlideBody({ slide, onAction }: SlideBodyProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-3 duration-300">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ececec]">
        {slide.eyebrow}
      </p>
      <h2 id="tutorial-title" className="mt-2 text-2xl font-semibold text-[#ececec]">
        {slide.title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[#a3a3a3]">{slide.body}</p>
      {slide.highlights && slide.highlights.length > 0 && (
        <HighlightList highlights={slide.highlights} />
      )}
      {slide.actions && slide.actions.length > 0 && (
        <TutorialActionRow actions={slide.actions} onAction={onAction} />
      )}
    </div>
  );
}

interface HighlightListProps {
  highlights: readonly import("./tutorial-slides").TutorialHighlight[];
}

function HighlightList({ highlights }: HighlightListProps) {
  return (
    <ul className="mt-4 space-y-2">
      {highlights.map((h) => (
        <li
          key={h.label}
          className="flex items-start gap-3 rounded-xl border border-[#2a2a2a] bg-[#222] px-3 py-2.5"
        >
          <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#5a5a5a]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold text-[#ececec]">{h.label}</p>
              {h.tag && <HighlightTag tag={h.tag} />}
            </div>
            <p className="text-[12px] leading-snug text-[#8a8a8a]">{h.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function HighlightTag({ tag }: { tag: "members" | "available" }) {
  const label = tag === "members" ? "School of Mentors Members" : "Available";
  return (
    <span className="flex-shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
      {label}
    </span>
  );
}

function CloseButton({ onDone }: { onDone: () => void }) {
  return (
    <button
      type="button"
      onClick={onDone}
      className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#737373] transition-colors hover:bg-[#2a2a2a] hover:text-[#ececec]"
      aria-label="Close tutorial"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

interface TutorialActionRowProps {
  actions: readonly TutorialAction[];
  onAction: (action: TutorialAction) => void;
}

function TutorialActionRow({ actions, onAction }: TutorialActionRowProps) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {actions.map((action, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onAction(action)}
          className="group inline-flex cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-[#464547] bg-[#2C2C2A] px-4 py-3 text-[13px] font-medium text-[#ececec] transition-colors duration-200 ease-out hover:border-[#565557] hover:text-white active:scale-[0.98]"
        >
          <span className="text-left leading-tight">{action.label}</span>
          <span
            aria-hidden
            className="text-[#8a8a8a] transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </button>
      ))}
    </div>
  );
}

interface DotsProps {
  count: number;
  activeIndex: number;
}

function Dots({ count, activeIndex }: DotsProps) {
  return (
    <div className="mt-7 flex items-center justify-center gap-2" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === activeIndex ? "w-7 bg-[#ececec]" : "w-1.5 bg-[#383838]"
          }`}
        />
      ))}
    </div>
  );
}

interface NavButtonsProps {
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
  onDone: () => void;
}

function NavButtons({ isFirst, isLast, onBack, onNext, onDone }: NavButtonsProps) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst}
        className="cursor-pointer rounded-lg px-3 py-2 text-sm text-[#a3a3a3] transition-colors hover:bg-[#2a2a2a] hover:text-[#ececec] disabled:cursor-not-allowed disabled:opacity-0"
      >
        Back
      </button>
      <button
        type="button"
        onClick={isLast ? onDone : onNext}
        className="cursor-pointer rounded-lg bg-[#ececec] px-5 py-2.5 text-sm font-semibold text-[#111] transition-colors hover:bg-white"
      >
        {isLast ? "Let's go" : "Next"}
      </button>
    </div>
  );
}
