import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome | School of Mentors AI",
  description: "Set up your profile to get started.",
  robots: "noindex, nofollow",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
