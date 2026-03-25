"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { persistLandingQuizSession } from "@/lib/landing-quiz-session";

type QuizQuestion = {
  id: string;
  title: string;
  subtitle: string;
  options: readonly string[];
};

/** Short funnel: fit + readiness (qualify tone) + first lane for SOM AI (onboarding can go deeper later). */
const questions: readonly QuizQuestion[] = [
  {
    id: "stuck",
    title: "Where are you leaking the most momentum right now?",
    subtitle: "Pick what hits closest. We use this to match how we talk to you, not to gatekeep.",
    options: [
      "Too much mentor content, not enough shipped work.",
      "Ideas and notes scatter across tools and tabs.",
      "Hard to turn episodes and calls into repeatable systems.",
      "All of the above.",
    ],
  },
  {
    id: "readiness",
    title: "How do you usually act on what your mentors teach?",
    subtitle: "Honest answers help us see whether you’re in build mode or still orienting. Both are fine.",
    options: [
      "I’m actively building, selling, or running something now.",
      "I’m getting ready to. I need clarity, then execution.",
      "I learn a lot; shipping is hit or miss.",
      "Mostly consuming for now; not in motion yet.",
    ],
  },
  {
    id: "first_win",
    title: "What should School of Mentors AI help you tighten first?",
    subtitle: "This sets a starting lane only. Integrations, stack, and workflows get handled in platform onboarding after you sign in.",
    options: [
      "Execution: offers, outreach, and sales conversations.",
      "Strategy: positioning, priorities, and what to do next.",
      "Consistency: habits, follow through, and overwhelm.",
      "Not sure yet. I’ll define it during onboarding.",
    ],
  },
];

/** Opt out of global `touch-action: manipulation` so the normal cursor shows over the white card. */
const quizShellClass = "cursor-auto touch-auto";

export function LandingQuiz() {
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const current = questions[qIndex];
  const selected = current ? answers[current.id] : undefined;
  const progressPct = useMemo(() => {
    if (done) return 100;
    return Math.round(((qIndex + (selected ? 1 : 0)) / (questions.length + 1)) * 100);
  }, [qIndex, selected, done]);

  function select(value: string) {
    if (!current) return;
    setAnswers((a) => ({ ...a, [current.id]: value }));
  }

  function next() {
    if (!current || !selected) return;
    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1);
    } else {
      persistLandingQuizSession({ ...answers, [current.id]: selected });
      setDone(true);
    }
  }

  if (done) {
    return (
      <div
        className={`rounded-lg border border-neutral-200 bg-white px-6 pt-6 pb-3 text-center shadow-sm sm:px-8 sm:pt-8 sm:pb-3 ${quizShellClass}`}
      >
        <p className="mb-3 text-sm leading-relaxed text-neutral-700">
          You&apos;re all set. Sign in with your registration email to continue into School of Mentors AI and turn mentor content into execution.
        </p>
        <Link
          href="/login"
          className="inline-flex min-w-[200px] cursor-pointer justify-center rounded-lg bg-[#810E0F] px-8 py-3 text-base font-bold text-white transition-colors hover:bg-[#6e0c0d] focus-visible:outline focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Continue
        </Link>
        <p className="mt-1 text-[11px] leading-none text-neutral-400 tabular-nums">100%</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm ${quizShellClass}`}>
      <div className="h-2 bg-neutral-200">
        <div className="h-full bg-[#810E0F] transition-[width] duration-300 ease-out" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="px-6 pt-6 pb-3 sm:px-8 sm:pt-8 sm:pb-3">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Question {qIndex + 1} of {questions.length}
        </p>
        <h3 className="mt-2 text-center text-lg font-bold leading-snug text-black sm:text-xl">{current.title}</h3>
        <p className="mt-2 text-center text-sm leading-relaxed text-neutral-600">{current.subtitle}</p>
        <ul className="mt-5 space-y-2.5 sm:mt-6">
          {current.options.map((opt) => {
            const on = selected === opt;
            return (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => select(opt)}
                  className={`w-full cursor-pointer rounded-lg border px-4 py-3.5 text-left text-[15px] transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#810E0F] focus-visible:ring-offset-2 ${
                    on ? "border-[#810E0F] bg-red-50 text-black font-semibold" : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-400"
                  }`}
                >
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 flex flex-col items-center gap-1 sm:mt-6">
          <button
            type="button"
            disabled={!selected}
            onClick={next}
            className="min-w-[200px] cursor-pointer rounded-lg bg-[#810E0F] px-8 py-3 text-base font-bold text-white transition-colors hover:bg-[#6e0c0d] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {qIndex < questions.length - 1 ? "Next" : "Finish"}
          </button>
          <p className="text-[11px] leading-none text-neutral-400 tabular-nums">{progressPct}%</p>
        </div>
      </div>
    </div>
  );
}
