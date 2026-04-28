import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/features/onboarding";

export const metadata: Metadata = {
  title: "Welcome — School of Mentors AI",
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
