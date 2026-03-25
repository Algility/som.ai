"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const GOAL_OPTIONS = [
  { value: "learn", label: "Learn from mentors" },
  { value: "podcasts", label: "Get insights from podcasts" },
  { value: "growth", label: "Track my growth" },
  { value: "exploring", label: "Just exploring" },
  { value: "other", label: "Other" },
] as const;

function hasDisplayName(user: { user_metadata?: Record<string, unknown> } | null): boolean {
  if (!user?.user_metadata) return false;
  const full = (user.user_metadata.full_name as string)?.trim();
  const name = (user.user_metadata.name as string)?.trim();
  return !!(full || name);
}

export default function OnboardingPage() {
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
      return;
    }
  }, [user, authLoading, router]);

  const handleStep1 = async (e: React.FormEvent) => {
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
      const full_name = [first, last].filter(Boolean).join(" ");
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name },
      });
      if (updateError) throw updateError;
      await supabase.auth.refreshSession();
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
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
    const goalValue = goal === "other" ? goalOther.trim() : GOAL_OPTIONS.find((o) => o.value === goal)?.label ?? goal;
    setSubmitting(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Not configured");
      const full_name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: full_name || undefined,
          onboarding_goal: goalValue,
        },
      });
      if (updateError) throw updateError;
      await supabase.auth.refreshSession();
      // Full page navigation so the edge proxy sees updated session cookie (avoids redirect loop)
      window.location.href = "/";
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user || hasDisplayName(user)) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-[#1a1a1a]">
        <div className="w-8 h-8 rounded-full border-2 border-[#404040] border-t-[#b5b5b5] animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="min-h-svh flex bg-[#1a1a1a]">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 px-4 pt-safe-area-auth pb-1.5">
          <Link href="/" className="inline-flex items-center gap-2 transition-colors duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]" aria-label="Home">
            <Image src="/logo.png" alt="" width={44} height={44} draggable={false} className="logo-no-drag h-11 w-auto object-contain select-none pointer-events-none" priority />
            <span className="text-base font-brand text-[#ececec] tracking-tight select-none">School of Mentors AI</span>
          </Link>
        </div>
        <main className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto py-5" aria-label="Onboarding">
          <div className="my-auto w-full max-w-sm px-4">
            <p className="text-xs font-medium text-[#737373] mb-4" aria-hidden="true">Step {step} of 2</p>
            {step === 1 ? (
              <form onSubmit={handleStep1} className="flex flex-col gap-6" aria-label="Set your name" noValidate>
              <FieldGroup className="gap-5">
                <div className="space-y-0.5 mb-0.5">
                  <h1 className="text-2xl font-bold text-[#ececec]">Welcome! What should we call you?</h1>
                  <p className="text-sm font-medium text-[#a3a3a3]">We’ll use this in the app.</p>
                </div>
{error && (
                <p id="onboarding-step1-error" className="text-base text-[#e07c7c]" role="alert" aria-live="assertive">{error}</p>
              )}
                <div className="flex w-full gap-4">
                  <Field className="min-w-0 flex-1 basis-0">
                    <FieldLabel htmlFor="onboarding-firstName" className="text-base">First name</FieldLabel>
                    <Input
                      id="onboarding-firstName"
                      name="firstName"
                      type="text"
                      placeholder="James"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="max-lg:min-h-[48px] transition-colors duration-150"
                      autoComplete="given-name"
                      aria-invalid={!!error}
                      aria-describedby={error ? "onboarding-step1-error" : undefined}
                    />
                  </Field>
                  <Field className="min-w-0 flex-1 basis-0">
                    <FieldLabel htmlFor="onboarding-lastName" className="text-base">Last name</FieldLabel>
                    <Input
                      id="onboarding-lastName"
                      name="lastName"
                      type="text"
                      placeholder="Dumoulin"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="max-lg:min-h-[48px] transition-colors duration-150"
                      autoComplete="family-name"
                      aria-invalid={!!error}
                      aria-describedby={error ? "onboarding-step1-error" : undefined}
                    />
                  </Field>
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 max-lg:min-h-[48px] text-base transition-colors duration-150 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#890B0F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] focus-visible:outline-none"
                >
                  {submitting ? "Saving…" : "Continue"}
                </Button>
              </FieldGroup>
            </form>
            ) : (
              <form onSubmit={handleStep2} className="flex flex-col gap-6" aria-label="Choose your goal" noValidate>
                <FieldGroup className="gap-5">
                  <div className="space-y-0.5 mb-0.5">
                    <h1 className="text-2xl font-bold text-[#ececec]">What brings you here?</h1>
                    <p className="text-sm font-medium text-[#a3a3a3]">Help us personalize your experience.</p>
                  </div>
                  {error && (
                    <p id="onboarding-step2-error" className="text-base text-[#e07c7c]" role="alert" aria-live="assertive">{error}</p>
                  )}
                  <Field>
                    <FieldLabel htmlFor="onboarding-goal" className="text-base">I'm mainly here to</FieldLabel>
                    <select
                      id="onboarding-goal"
                      name="goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full h-11 max-lg:min-h-[48px] rounded-md border border-[#333] bg-[#1a1a1a] px-3 text-[#ececec] text-base transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#890B0F] focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
                      aria-invalid={!!error}
                      aria-describedby={error ? "onboarding-step2-error" : undefined}
                    >
                      <option value="">Select one…</option>
                      {GOAL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Field>
                  {goal === "other" && (
                    <Field>
                      <FieldLabel htmlFor="onboarding-goal-other" className="text-base">Tell us more</FieldLabel>
                      <Input
                        id="onboarding-goal-other"
                        type="text"
                        placeholder="e.g. Find a mentor in my field"
                        value={goalOther}
                        onChange={(e) => setGoalOther(e.target.value)}
                        className="max-lg:min-h-[48px] transition-colors duration-150"
                      />
                    </Field>
                  )}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setStep(1); setError(null); }}
                      className="flex-1 h-11 max-lg:min-h-[48px] text-base border-[#404040] text-[#a3a3a3] hover:bg-[#262626] focus-visible:ring-2 focus-visible:ring-[#404040] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 h-11 max-lg:min-h-[48px] text-base transition-colors duration-150 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#890B0F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] focus-visible:outline-none"
                    >
                      {submitting ? "Taking you in…" : "Get started"}
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            )}
          </div>
        </main>
      </div>
      <div className="hidden lg:flex flex-1 min-h-svh flex-col items-center justify-center gap-3 bg-[#141414] p-8 flex-shrink-0">
        <Link href="/" className="focus-visible:outline-none focus-visible:ring-0 rounded-lg no-underline block w-fit">
          <Image
            src="/logo.png"
            alt="School of Mentors"
            width={256}
            height={256}
            draggable={false}
            className="logo-no-drag w-48 h-48 lg:w-64 lg:h-64 object-contain [mix-blend-mode:multiply] dark:[mix-blend-mode:normal] select-none pointer-events-none"
            priority
          />
        </Link>
      </div>
    </div>
  );
}
