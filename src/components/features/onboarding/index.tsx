"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import {
  hasDisplayName,
  saveDisplayName,
  saveOnboardingGoal,
} from "@/services/onboarding";
import { resolveGoalLabel } from "./goal-options";
import { NameStep } from "./name-step";
import { GoalStep } from "./goal-step";

export function OnboardingFlow() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [goal, setGoal] = useState("");
  const [goalOther, setGoalOther] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (hasDisplayName(user)) {
      window.location.href = "/";
    }
  }, [user, authLoading, router]);

  const handleStep1 = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first && !last) {
      setError("Please enter at least your first name.");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Not configured");
      await saveDisplayName(supabase, first, last);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2 = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!goal) {
      setError("Please pick an option.");
      return;
    }
    if (goal === "other" && !goalOther.trim()) {
      setError("Please tell us more in Other.");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Not configured");
      await saveOnboardingGoal(supabase, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        goal: resolveGoalLabel(goal, goalOther),
      });
      // Full page navigation so the edge proxy sees updated session cookie
      // (avoids redirect loop).
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user || hasDisplayName(user)) {
    return <OnboardingLoadingScreen />;
  }

  return (
    <div className="min-h-svh flex bg-[#1a1a1a]">
      <div className="flex-1 flex flex-col min-h-0">
        <OnboardingHeader />
        <main
          className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto py-5"
          aria-label="Onboarding"
        >
          <div className="my-auto w-full max-w-sm px-4">
            <p className="text-xs font-medium text-[#737373] mb-4" aria-hidden="true">
              Step {step} of 2
            </p>
            {step === 1 ? (
              <NameStep
                firstName={firstName}
                lastName={lastName}
                submitting={submitting}
                error={error}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onSubmit={handleStep1}
              />
            ) : (
              <GoalStep
                goal={goal}
                goalOther={goalOther}
                submitting={submitting}
                error={error}
                onGoalChange={setGoal}
                onGoalOtherChange={setGoalOther}
                onBack={() => {
                  setStep(1);
                  setError(null);
                }}
                onSubmit={handleStep2}
              />
            )}
          </div>
        </main>
      </div>
      <OnboardingHero />
    </div>
  );
}

function OnboardingLoadingScreen() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-[#1a1a1a]">
      <div
        className="w-8 h-8 rounded-full border-2 border-[#404040] border-t-[#b5b5b5] animate-spin"
        aria-hidden
      />
    </div>
  );
}

function OnboardingHeader() {
  return (
    <div className="flex-shrink-0 px-4 pt-safe-area-auth pb-1.5">
      <Link
        href="/"
        className="inline-flex items-center gap-2 transition-colors duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
        aria-label="Home"
      >
        <Image
          src="/logo.png"
          alt=""
          width={44}
          height={44}
          draggable={false}
          className="logo-no-drag h-11 w-auto object-contain select-none pointer-events-none"
          priority
        />
        <span className="text-base font-brand text-[#ececec] tracking-tight select-none">
          School of Mentors AI
        </span>
      </Link>
    </div>
  );
}

function OnboardingHero() {
  return (
    <div className="hidden lg:flex flex-1 min-h-svh flex-col items-center justify-center gap-3 bg-[#141414] p-8 flex-shrink-0">
      <Link
        href="/"
        className="focus-visible:outline-none focus-visible:ring-0 rounded-lg no-underline block w-fit"
      >
        <Image
          src="/logo.png"
          alt="School of Mentors AI"
          width={256}
          height={256}
          draggable={false}
          className="logo-no-drag w-48 h-48 lg:w-64 lg:h-64 object-contain [mix-blend-mode:multiply] dark:[mix-blend-mode:normal] select-none pointer-events-none"
          priority
        />
      </Link>
    </div>
  );
}
