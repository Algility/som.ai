"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_token: "Confirmation link is invalid or incomplete.",
  verify_failed: "Confirmation link expired or invalid. Try signing up again or request a new reset link.",
  missing_code: "Sign-in was cancelled or the link was invalid.",
  auth: "Authentication failed. Please try again.",
  config: "Auth is not configured. Check your environment.",
};

function getAuthErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "Something went wrong.");
  if (/rate limit|too many requests|email.*limit/i.test(msg)) {
    return "Too many emails sent. Please wait an hour and try again.";
  }
  if (/network|failed to fetch|load failed|connection|timed out/i.test(msg)) {
    return "Connection failed. Check your network and try again.";
  }
  if (err instanceof TypeError && /fetch|load failed/i.test(String(err))) {
    return "Connection failed. Check your network and try again.";
  }
  if (/missing.*email|missing.*phone|email.*required|invalid login credentials/i.test(msg)) {
    return "Please enter your email and password.";
  }
  return msg;
}

export function LoginForm({
  className,
  errorFromUrl,
  ...props
}: React.ComponentProps<"form"> & { errorFromUrl?: string }) {
  const { signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(
    errorFromUrl ? (AUTH_ERROR_MESSAGES[errorFromUrl] ?? "Something went wrong.") : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signUpEmailSent, setSignUpEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setSubmitting(true);
    try {
      if (isSignUp) {
        const data = await signUp(email, password);
        if (data?.user && !data?.session) {
          setSignUpEmailSent(true);
        } else {
          setRedirecting(true);
          setTimeout(() => { window.location.href = "/onboarding"; }, 150);
          return;
        }
      } else {
        await signIn(email, password);
        setRedirecting(true);
        setTimeout(() => { window.location.href = "/"; }, 150);
        return;
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
    } finally {
      setGoogleLoading(false);
    }
  };

  if (signUpEmailSent) {
    return (
      <div className={cn("flex flex-col gap-4 text-center max-w-sm", className)}>
        <p className="text-2xl font-bold text-[#ececec] mb-1">Check your email</p>
        <p className="text-base text-[#a3a3a3]">
          We sent a confirmation link to{" "}
          <span className="text-[#d4d4d4]">{email}</span>. Confirm your account to continue.
        </p>
        <p className="text-sm text-[#737373]">Check your spam folder if you don't see it in a few minutes.</p>
        <button
          type="button"
          onClick={() => { setSignUpEmailSent(false); setIsSignUp(false); setError(null); }}
          className="text-base text-[#a3a3a3] hover:text-[#ececec] transition-colors duration-150 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] rounded"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  const errorId = "login-error";
  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} aria-label={isSignUp ? "Sign up" : "Sign in"} noValidate {...props}>
      <FieldGroup className={isSignUp ? "gap-4" : "gap-6"}>
        <div className="space-y-0.5 mb-0.5">
          <h1 className="text-2xl font-bold text-[#ececec]">
            {isSignUp ? "Get started" : "Welcome back"}
          </h1>
          <p className="text-sm font-medium text-[#a3a3a3]">
            {isSignUp ? "Create a new account" : "Sign in to your account"}
          </p>
        </div>

        {error && (
          <div className="space-y-1">
            <p id={errorId} className="text-base text-[#e07c7c]" role="alert" aria-live="assertive">
              {error}
            </p>
            {errorFromUrl && (errorFromUrl === "verify_failed" || errorFromUrl === "missing_code" || errorFromUrl === "missing_token") && (
              <p className="text-sm text-[#a3a3a3]">Sign in again below or use Forgot password to get a new link.</p>
            )}
          </div>
        )}

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

        <Field>
          <FieldLabel htmlFor="password" className="text-base">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10 max-lg:min-h-[48px] transition-colors duration-150"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#a3a3a3] hover:text-[#ececec] transition-colors duration-150"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          {!isSignUp && (
            <div className="flex justify-end mt-1.5">
              <Link
                href="/forgot-password"
                className="text-base text-[#a3a3a3] hover:text-[#ececec] transition-colors duration-150"
              >
                Forgot your password?
              </Link>
            </div>
          )}
        </Field>

        {isSignUp && (
          <Field>
            <FieldLabel htmlFor="confirmPassword" className="text-base">Confirm password</FieldLabel>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pr-10 max-lg:min-h-[48px] transition-colors duration-150"
                autoComplete="new-password"
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#a3a3a3] hover:text-[#ececec] transition-colors duration-150"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </Field>
        )}

        <div className="space-y-1.5">
          <Button
            type="submit"
            disabled={submitting || redirecting}
            className="w-full h-11 max-lg:min-h-[48px] text-base transition-colors duration-150 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#890B0F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] focus-visible:outline-none"
          >
            {redirecting
              ? (isSignUp ? "Taking you to onboarding…" : "Taking you in…")
              : submitting
                ? (isSignUp ? "Signing up…" : "Signing in…")
                : (isSignUp ? "Sign up" : "Sign in")}
          </Button>
        </div>

        <div className="relative flex items-center gap-3 py-1.5">
          <div className="flex-1 border-t border-[#505050] min-w-0" aria-hidden />
          <span className="text-sm text-[#737373] shrink-0">or</span>
          <div className="flex-1 border-t border-[#505050] min-w-0" aria-hidden />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full max-lg:min-h-[48px] h-11 gap-2.5 text-base font-medium transition-colors duration-150 active:scale-[0.99] border border-[#404040] bg-transparent text-[#e5e5e5] hover:border-[#525252] hover:bg-[#262626] focus-visible:ring-2 focus-visible:ring-[#404040] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] focus-visible:outline-none"
        >
          {googleLoading ? (
            <span className="flex items-center gap-2.5">
              <span className="size-5 rounded-full border-2 border-[#404040] border-t-[#e5e5e5] animate-spin" aria-hidden />
              Signing in...
            </span>
          ) : (
            <>
              <GoogleIcon className="size-5 shrink-0" aria-hidden />
              Continue with Google
            </>
          )}
        </Button>

        <div className="text-center space-y-1">
          <p className="text-base text-[#a3a3a3]">
            {isSignUp ? "Have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-[#ececec] hover:underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] rounded"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </FieldGroup>
    </form>
  );
}
