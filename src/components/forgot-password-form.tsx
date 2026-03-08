"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function getAuthErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "Something went wrong.");
  if (/rate limit|too many requests|email.*limit/i.test(msg)) {
    return "Too many emails sent. Please wait an hour and try again.";
  }
  if (/network|failed to fetch|load failed|connection/i.test(msg)) {
    return "Connection failed. Check your network and try again.";
  }
  if (/missing.*email|missing.*phone|email.*required/i.test(msg)) {
    return "Please enter your email address.";
  }
  return msg;
}

export function ForgotPasswordForm({ className }: { className?: string }) {
  const { resetPasswordForEmail, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (authLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-sm" role="status" aria-live="polite">
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-40 rounded bg-[#2a2a2a]" aria-hidden />
          <div className="h-4 w-72 rounded bg-[#2a2a2a]" aria-hidden />
          <div className="h-12 mt-6 rounded bg-[#2a2a2a]" aria-hidden />
        </div>
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#404040] border-t-[#b5b5b5] animate-spin" aria-hidden />
          <p className="text-base text-[#a3a3a3]">Checking session...</p>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className={className}>
        <p className="text-2xl font-bold text-[#ececec] mb-1">Check your email</p>
        <p className="text-base text-[#a3a3a3] text-center">
          We sent a reset link to <span className="text-[#d4d4d4]">{email}</span>. Use it to set a new password.
        </p>
        <p className="text-sm text-[#737373] text-center">Check your spam folder if you don't see it in a few minutes.</p>
        <Link href="/login" className="mt-4 block text-center text-base text-[#a3a3a3] hover:text-[#ececec] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] rounded inline-block">
          Back to login
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await resetPasswordForEmail(email);
      setSent(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const errorId = "forgot-password-error";
  return (
    <form onSubmit={handleSubmit} className={className} aria-label="Reset password" noValidate>
      <FieldGroup className="gap-6">
        <div className="space-y-0.5 mb-0.5">
          <h1 className="text-2xl font-bold text-[#ececec]">Reset password</h1>
          <p className="text-sm font-medium text-[#a3a3a3]">We'll email you a reset link.</p>
        </div>
        {error && <p id={errorId} className="text-base text-[#e07c7c]" role="alert" aria-live="assertive">{error}</p>}
        <Field>
          <FieldLabel htmlFor="email" className="text-base">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="max-lg:min-h-[48px] transition-colors duration-150"
            autoComplete="email"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        </Field>
        <Button type="submit" disabled={submitting} className="w-full h-11 max-lg:min-h-[48px] text-base transition-colors duration-150 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#890B0F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] focus-visible:outline-none">
          {submitting ? "Sending..." : "Send reset link"}
        </Button>
        <Link href="/login" className="text-base text-[#a3a3a3] hover:text-[#ececec] transition-colors duration-150 text-center block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] rounded">
          Back to login
        </Link>
      </FieldGroup>
    </form>
  );
}
