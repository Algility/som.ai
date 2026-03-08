import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirm your email | School of Mentors AI",
  description: "Confirm your email address to continue.",
  robots: "noindex, nofollow",
};

export default function AuthConfirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
