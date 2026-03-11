import Link from "next/link";

export const metadata = {
  title: "Not found | School of Mentors AI",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-[#1a1a1a] p-6">
      <h1 className="text-xl font-semibold text-[#ececec]">Page not found</h1>
      <p className="text-sm text-[#a3a3a3] text-center max-w-sm">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-[#890B0F] text-white text-sm font-medium hover:bg-[#a01010] transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
