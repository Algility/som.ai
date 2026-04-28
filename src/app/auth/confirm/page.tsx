import type { Metadata } from "next";
import { AuthConfirmFlow } from "@/components/features/auth-confirm";

export const metadata: Metadata = {
  title: "Confirming — School of Mentors AI",
};

export default function AuthConfirmPage() {
  return <AuthConfirmFlow />;
}
