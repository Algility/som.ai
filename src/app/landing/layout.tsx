import { Montserrat } from "next/font/google";

const landingDisplay = Montserrat({
  variable: "--font-landing-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={landingDisplay.variable} data-landing-scroll>
      {children}
    </div>
  );
}
