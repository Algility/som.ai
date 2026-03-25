import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { landingVslIframeSrc, toVideoEmbedUrl } from "@/lib/landing-vsl";
import { LandingQuiz } from "./landing-quiz";

export const metadata: Metadata = {
  title: "School of Mentors AI",
  description:
    "Watch the video, complete the short quiz, and sign in to your mentor-grounded AI workspace.",
};

const landingLogoClassName =
  "logo-no-drag h-20 w-auto max-w-[min(100%,12rem)] shrink-0 object-contain select-none sm:h-32 sm:max-w-none md:h-36";

const landingFooterLogoClassName =
  "logo-no-drag h-14 w-auto max-w-[min(100%,8.5rem)] shrink-0 object-contain select-none sm:h-24 sm:max-w-none md:h-28";

function Step1VideoBlock({ embed }: { embed: string | null }) {
  return (
    <div className="mt-4 w-full max-w-3xl overflow-hidden rounded-lg bg-black sm:mt-5">
      <p className="flex w-full items-center justify-center overflow-x-auto bg-white px-4 py-2.5 sm:px-5 sm:py-3 [font-family:var(--font-landing-display),system-ui,sans-serif] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <span className="whitespace-nowrap text-center text-base font-black italic leading-snug tracking-tight text-black sm:text-lg md:text-xl lg:text-2xl">
          Step 1: Watch The Short Video Below
        </span>
      </p>
      {embed ? (
        <div className="aspect-video w-full bg-black">
          <iframe
            src={landingVslIframeSrc(embed)}
            title="School of Mentors AI — watch first"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
      ) : (
        <div
          className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-neutral-950 px-6"
          role="region"
          aria-label="Video placeholder"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white">
            <svg className="ml-1 h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-sm text-neutral-400">Your video will appear here.</p>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const vslEmbed = toVideoEmbedUrl(process.env.NEXT_PUBLIC_LANDING_VSL_URL);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#000] font-sans text-[#ececec] antialiased selection:bg-white/20">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-10 pt-1 sm:px-6 sm:pb-12 sm:pt-2 md:pb-14">
        <header className="mb-4 flex w-full justify-center sm:mb-5 md:mb-6">
          <Link
            href="/"
            className="block rounded-lg transition-opacity duration-150 hover:opacity-90 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-4 focus-visible:ring-offset-black"
            aria-label="School of Mentors AI home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={256}
              height={256}
              draggable={false}
              className={landingLogoClassName}
              priority
            />
          </Link>
        </header>

        <h1
          className="w-full max-w-4xl px-1 text-center text-balance font-black leading-[1.05] tracking-[-0.03em] text-white sm:leading-[1.04] sm:tracking-[-0.035em] md:leading-[1.03] lg:max-w-[52rem] [font-family:var(--font-landing-display),system-ui,sans-serif] text-[clamp(1.2rem,3.4vw+0.55rem,2.85rem)] sm:text-[clamp(1.35rem,3vw+0.65rem,3.15rem)]"
        >
          Discover The System Used By Serious Operators To Turn Mentor Content Into Execution, Win Back Time &amp; Rebuild Momentum In Your Business
        </h1>

        <Step1VideoBlock embed={vslEmbed} />

        <div className="mt-20 w-full max-w-2xl scroll-mt-8 text-center sm:mt-24">
          <h2 className="text-xl font-black uppercase tracking-[0.06em] text-white sm:text-2xl md:text-3xl [font-family:var(--font-landing-display),system-ui,sans-serif]">
            STEP 2: COMPLETE THE QUIZ BELOW
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-400 sm:text-lg sm:leading-relaxed">
            Three quick questions to check fit and set a starting lane for School of Mentors AI. Stack, tools, and full setup come after you sign in.
          </p>
        </div>

        <div className="mt-10 w-full max-w-2xl sm:mt-12">
          <LandingQuiz />
        </div>

        <footer className="mt-12 w-full pb-6 pt-6 text-center sm:mt-14 sm:pb-8 sm:pt-8">
          <div className="mb-6 flex w-full justify-center sm:mb-7">
            <Link
              href="/"
              className="block rounded-lg transition-opacity duration-150 hover:opacity-90 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-4 focus-visible:ring-offset-black"
              aria-label="School of Mentors AI home"
            >
              <Image
                src="/logo.png"
                alt=""
                width={192}
                height={192}
                draggable={false}
                className={landingFooterLogoClassName}
              />
            </Link>
          </div>
          <div className="mx-auto w-full max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
            Copyright © {new Date().getFullYear()}+. All rights reserved.
          </p>
          <nav className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-neutral-500" aria-label="Legal">
            <a href="mailto:somai@schoolofmentors.com?subject=Privacy%20Policy" className="hover:text-neutral-300 underline-offset-2 hover:underline">
              Privacy Policy
            </a>
            <span className="text-neutral-600" aria-hidden>
              |
            </span>
            <a href="mailto:somai@schoolofmentors.com?subject=Terms%20of%20Service" className="hover:text-neutral-300 underline-offset-2 hover:underline">
              Terms of Service
            </a>
          </nav>
          <p className="mx-auto mt-6 max-w-lg text-[11px] leading-relaxed text-neutral-600">
            This site is not a part of the Facebook website or Facebook Inc. Additionally, this site is not endorsed by Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.
          </p>
          <p className="mx-auto mt-3 max-w-lg text-[11px] leading-relaxed text-neutral-600">
            This site is not a part of YouTube, Google, or Meta. YouTube is a trademark of Google LLC.
          </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
