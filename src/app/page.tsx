import type { Metadata } from "next";
import { Home } from "@/components/features/home";

export const metadata: Metadata = {
  title: "School of Mentors AI",
};

export default function HomePage() {
  return <Home />;
}
