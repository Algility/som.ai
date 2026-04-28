"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface NameStepProps {
  firstName: string;
  lastName: string;
  submitting: boolean;
  error: string | null;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function NameStep({
  firstName,
  lastName,
  submitting,
  error,
  onFirstNameChange,
  onLastNameChange,
  onSubmit,
}: NameStepProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6"
      aria-label="Set your name"
      noValidate
    >
      <FieldGroup className="gap-5">
        <div className="space-y-0.5 mb-0.5">
          <h1 className="text-2xl font-bold text-[#ececec]">
            Welcome! What should we call you?
          </h1>
          <p className="text-sm font-medium text-[#a3a3a3]">
            We&apos;ll use this in the app.
          </p>
        </div>
        {error && (
          <p
            id="onboarding-step1-error"
            className="text-base text-[#e07c7c]"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}
        <div className="flex w-full gap-4">
          <Field className="min-w-0 flex-1 basis-0">
            <FieldLabel htmlFor="onboarding-firstName" className="text-base">
              First name
            </FieldLabel>
            <Input
              id="onboarding-firstName"
              name="firstName"
              type="text"
              placeholder="James"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              className="max-lg:min-h-[48px] transition-colors duration-150"
              autoComplete="given-name"
              aria-invalid={!!error}
              aria-describedby={error ? "onboarding-step1-error" : undefined}
            />
          </Field>
          <Field className="min-w-0 flex-1 basis-0">
            <FieldLabel htmlFor="onboarding-lastName" className="text-base">
              Last name
            </FieldLabel>
            <Input
              id="onboarding-lastName"
              name="lastName"
              type="text"
              placeholder="Dumoulin"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
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
  );
}
