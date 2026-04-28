"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GOAL_OPTIONS } from "./goal-options";

interface GoalStepProps {
  goal: string;
  goalOther: string;
  submitting: boolean;
  error: string | null;
  onGoalChange: (value: string) => void;
  onGoalOtherChange: (value: string) => void;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function GoalStep({
  goal,
  goalOther,
  submitting,
  error,
  onGoalChange,
  onGoalOtherChange,
  onBack,
  onSubmit,
}: GoalStepProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6"
      aria-label="Choose your goal"
      noValidate
    >
      <FieldGroup className="gap-5">
        <div className="space-y-0.5 mb-0.5">
          <h1 className="text-2xl font-bold text-[#ececec]">What brings you here?</h1>
          <p className="text-sm font-medium text-[#a3a3a3]">
            Help us personalize your experience.
          </p>
        </div>
        {error && (
          <p
            id="onboarding-step2-error"
            className="text-base text-[#e07c7c]"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}
        <Field>
          <FieldLabel htmlFor="onboarding-goal" className="text-base">
            I&apos;m mainly here to
          </FieldLabel>
          <select
            id="onboarding-goal"
            name="goal"
            value={goal}
            onChange={(e) => onGoalChange(e.target.value)}
            className="w-full h-11 max-lg:min-h-[48px] rounded-md border border-[#333] bg-[#1a1a1a] px-3 text-[#ececec] text-base transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#890B0F] focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
            aria-invalid={!!error}
            aria-describedby={error ? "onboarding-step2-error" : undefined}
          >
            <option value="">Select one…</option>
            {GOAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        {goal === "other" && (
          <Field>
            <FieldLabel htmlFor="onboarding-goal-other" className="text-base">
              Tell us more
            </FieldLabel>
            <Input
              id="onboarding-goal-other"
              type="text"
              placeholder="e.g. Find a mentor in my field"
              value={goalOther}
              onChange={(e) => onGoalOtherChange(e.target.value)}
              className="max-lg:min-h-[48px] transition-colors duration-150"
            />
          </Field>
        )}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
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
  );
}
