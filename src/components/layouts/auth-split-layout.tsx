import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

interface AuthSplitLayoutProps {
  headerHref: string;
  headerAriaLabel: string;
  children: ReactNode;
}

/** Split layout shared by /login, /auth/confirm, /onboarding, /forgot-password. */
export function AuthSplitLayout({
  headerHref,
  headerAriaLabel,
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className="min-h-svh flex bg-[#1a1a1a]">
      <div className="flex-1 flex flex-col min-h-0">
        <AuthHeader href={headerHref} ariaLabel={headerAriaLabel} />
        {children}
      </div>
      <AuthHero />
    </div>
  );
}

interface AuthHeaderProps {
  href: string;
  ariaLabel: string;
}

function AuthHeader({ href, ariaLabel }: AuthHeaderProps) {
  return (
    <div className="flex-shrink-0 px-4 pt-safe-area-auth pb-1.5">
      <Link
        href={href}
        className="inline-flex items-center gap-2 transition-colors duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
        aria-label={ariaLabel}
      >
        <Image
          src="/logo.png"
          alt=""
          width={44}
          height={44}
          draggable={false}
          className="logo-no-drag h-11 w-auto object-contain select-none pointer-events-none"
          priority
        />
        <span className="text-base font-brand text-[#ececec] tracking-tight select-none">
          School of Mentors AI
        </span>
      </Link>
    </div>
  );
}

function AuthHero() {
  return (
    <div className="hidden lg:flex flex-1 min-h-svh flex-col items-center justify-center gap-3 bg-[#141414] p-8 flex-shrink-0">
      <Link
        href="/"
        className="focus-visible:outline-none focus-visible:ring-0 rounded-lg no-underline block w-fit"
      >
        <Image
          src="/logo.png"
          alt="School of Mentors AI"
          width={256}
          height={256}
          draggable={false}
          className="logo-no-drag w-48 h-48 lg:w-64 lg:h-64 object-contain [mix-blend-mode:multiply] dark:[mix-blend-mode:normal] select-none pointer-events-none"
          priority
        />
      </Link>
    </div>
  );
}
