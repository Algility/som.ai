import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="min-h-svh flex bg-[#1a1a1a]">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 px-4 pt-safe-area pb-1.5">
          <Link href="/" className="inline-flex items-center gap-2 transition-colors duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#353535] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]" aria-label="Home">
            <img src="/logo.png" alt="" className="h-11 w-auto object-contain select-none pointer-events-none" width={44} height={44} draggable={false} />
            <span className="text-base font-brand text-[#ececec] tracking-tight select-none">School of Mentors AI</span>
          </Link>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto py-5">
          <div className="my-auto w-full max-w-sm px-4">
            <LoginForm errorFromUrl={error ?? undefined} />
          </div>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 min-h-svh flex-col items-center justify-center gap-3 bg-[#141414] p-8 flex-shrink-0">
        <Link href="/" className="focus-visible:outline-none focus-visible:ring-0 rounded-lg no-underline">
          <img src="/logo.png" alt="School of Mentors" className="w-56 h-56 object-contain select-none drop-shadow-none pointer-events-none" width={224} height={224} draggable={false} />
        </Link>
      </div>
    </div>
  );
}
