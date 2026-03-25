/** Session snapshot after the landing quiz—read this after sign-in to tailor onboarding (not a substitute for full platform setup). */
export const LANDING_QUIZ_SESSION_KEY = "som-landing-quiz-v1";

export type LandingQuizSessionPayload = {
  answers: Record<string, string>;
  completedAt: number;
};

export function persistLandingQuizSession(answers: Record<string, string>): void {
  try {
    const payload: LandingQuizSessionPayload = {
      answers,
      completedAt: Date.now(),
    };
    sessionStorage.setItem(LANDING_QUIZ_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota */
  }
}

export function readLandingQuizSession(): LandingQuizSessionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LANDING_QUIZ_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LandingQuizSessionPayload;
  } catch {
    return null;
  }
}

export function clearLandingQuizSession(): void {
  try {
    sessionStorage.removeItem(LANDING_QUIZ_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
