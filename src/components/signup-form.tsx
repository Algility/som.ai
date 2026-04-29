"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/ui/google-icon";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export function SignupForm({ className, ...props }: React.ComponentProps<"form">) {
  const { signUp, signInWithGoogle, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (authLoading) {
    return (
      <div className={cn("flex flex-col gap-6 w-full max-w-sm", className)} role="status" aria-live="polite">
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-48 rounded bg-[#2a2a2a]" aria-hidden />
          <div className="h-4 w-64 rounded bg-[#2a2a2a]" aria-hidden />
          <div className="h-12 mt-6 rounded bg-[#2a2a2a]" aria-hidden />
          <div className="h-12 rounded bg-[#2a2a2a]" aria-hidden />
        </div>
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#404040] border-t-[#b5b5b5] animate-spin" aria-hidden />
          <p className="text-base text-[#a3a3a3]">Checking session...</p>
        </div>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className={cn("flex flex-col gap-4 text-center max-w-sm", className)}>
        <p className="text-2xl font-bold text-[#ececec] mb-1">Check your email</p>
        <p className="text-base text-[#a3a3a3]">
          We sent a confirmation link to <span className="text-[#d4d4d4]">{email}</span>. Confirm your account to continue.
        </p>
        <p className="text-sm text-[#737373]">Check your spam folder if you don&apos;t see it.</p>
        <Link href="/login" className="text-base text-[#a3a3a3] hover:text-[#ececec] transition-colors duration-150 underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await signUp(email, password);
      if (data?.user && !data?.session) {
        setEmailSent(true);
      } else {
        setTimeout(() => { window.location.href = "/onboarding"; }, 150);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setGoogleLoading(false);
    }
  };

  const errorId = "signup-error";
  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} aria-label="Sign up" noValidate {...props}>
      <FieldGroup className="gap-4">
        <div className="space-y-0.5 mb-0.5">
          <h1 className="text-2xl font-bold text-[#ececec]">Get started</h1>
          <p className="text-sm font-medium text-[#a3a3a3]">Create a new account</p>
        </div>

        {error && (
          <p id={errorId} className="text-base text-[#e07c7c]" role="alert" aria-live="assertive">{error}</p>
        )}

        <Field>
          <FieldLabel htmlFor="email" className="text-base">Email</FieldLabel>
          <Input id="email" name="email" type="email" inputMode="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} required
            className="max-lg:min-h-[48px] transition-colors duration-150" autoComplete="email"
            aria-invalid={!!error} aria-describedby={error ? errorId : undefined} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password" className="text-base">Password</FieldLabel>
          <div className="relative">
            <Input id="password" name="password" type={showPassword ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)} required
              className="pr-10 max-lg:min-h-[48px] transition-colors duration-150" autoComplete="new-password"
              aria-invalid={!!error} aria-describedby={error ? errorId : undefined} />
            <button type="button" onClick={() => setShowPassword((p) => !p)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#a3a3a3] hover:text-[#ececec] transition-colors duration-150"
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword" className="text-base">Confirm password</FieldLabel>
          <div className="relative">
            <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              className="pr-10 max-lg:min-h-[48px] transition-colors duration-150" autoComplete="new-password"
              aria-invalid={!!error} aria-describedby={error ? errorId : undefined} />
            <button type="button" onClick={() => setShowConfirmPassword((p) => !p)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#a3a3a3] hover:text-[#ececec] transition-colors duration-150"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
              {showConfirmPassword
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
          </div>
        </Field>

        <Button type="submit" disabled={submitting}
          className="w-full h-11 max-lg:min-h-[48px] text-base transition-colors duration-150 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#890B0F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] focus-visible:outline-none mt-2">
          {submitting ? "Creating account…" : "Sign up"}
        </Button>

        <div className="relative flex items-center gap-3 py-1.5">
          <div className="flex-1 border-t border-[#505050] min-w-0" aria-hidden />
          <span className="text-sm text-[#737373] shrink-0">or</span>
          <div className="flex-1 border-t border-[#505050] min-w-0" aria-hidden />
        </div>

        <Button type="button" variant="outline" onClick={handleGoogle} disabled={googleLoading}
          className="w-full max-lg:min-h-[48px] h-11 gap-2.5 text-base font-medium transition-colors duration-150 active:scale-[0.99] border border-[#404040] bg-transparent text-[#e5e5e5] hover:border-[#525252] hover:bg-[#262626] focus-visible:ring-2 focus-visible:ring-[#404040] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] focus-visible:outline-none">
          {googleLoading
            ? <span className="flex items-center gap-2.5"><span className="size-5 rounded-full border-2 border-[#404040] border-t-[#e5e5e5] animate-spin" aria-hidden />Signing up...</span>
            : <><GoogleIcon className="size-5 shrink-0" aria-hidden />Continue with Google</>
          }
        </Button>

        <p className="text-center text-base text-[#a3a3a3]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#ececec] hover:underline transition-colors duration-150">Sign in</Link>
        </p>
      </FieldGroup>
    </form>
  );
}
