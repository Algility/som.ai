import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Sign in | School of Mentors AI",
  description: "Sign in to your account.",
  robots: "noindex, nofollow",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="min-h-svh flex bg-[#1a1a1a]">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 px-4 pt-safe-area-auth pb-1.5">
          <Link href="/" className="inline-flex items-center gap-2 transition-colors duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]" aria-label="Home">
            <Image src="/logo.png" alt="" width={44} height={44} className="h-11 w-auto object-contain select-none pointer-events-none" priority />
            <span className="text-base font-brand text-[#ececec] tracking-tight select-none">School of Mentors AI</span>
          </Link>
        </div>
        <main className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto py-5" aria-label="Sign in">
          <div className="my-auto w-full max-w-sm px-4">
            <LoginForm errorFromUrl={error ?? undefined} />
          </div>
        </main>
      </div>
      <div className="hidden lg:flex flex-1 min-h-svh flex-col items-center justify-center gap-3 bg-[#141414] p-8 flex-shrink-0">
        <Link href="/" className="focus-visible:outline-none focus-visible:ring-0 rounded-lg no-underline block w-fit">
          <Image
            src="/logo.png"
            alt="School of Mentors"
            width={256}
            height={256}
            className="w-48 h-48 lg:w-64 lg:h-64 object-contain [mix-blend-mode:multiply] dark:[mix-blend-mode:normal] select-none pointer-events-none"
            priority
          />
        </Link>
      </div>
    </div>
  );
}
