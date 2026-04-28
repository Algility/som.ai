import { ExternalLink } from "lucide-react";

/**
 * Funnel CTAs that live at the bottom of the sidebar, just above the profile
 * footer. Compact, quiet, and always visible without ever overlapping the
 * chat view. Update the destination by setting NEXT_PUBLIC_SKOOL_URL in
 * .env.local.
 */

const SKOOL_URL =
  process.env.NEXT_PUBLIC_SKOOL_URL ??
  "https://www.skool.com/schoolofmentors/about";

interface CtaItem {
  label: string;
  href: string;
}

// Plain spaces so the browser wraps naturally: "Get Access to Millionaires &"
// on line 1, "Billionaires Live" on line 2.
const CTAS: readonly CtaItem[] = [
  {
    label: "Get Access to Millionaires & Billionaires Live",
    href: SKOOL_URL,
  },
  {
    label: "Want My Team's 1-on-1 Help Going Viral on Social Media",
    href: SKOOL_URL,
  },
];

export function CtaButtons() {
  return (
    <div className="flex flex-col gap-1">
      {CTAS.map((cta) => (
        <CtaLink key={cta.label} cta={cta} />
      ))}
    </div>
  );
}

interface CtaLinkProps {
  cta: CtaItem;
}

function CtaLink({ cta }: CtaLinkProps) {
  return (
    <a
      href={cta.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start justify-between gap-2 rounded-lg border border-[#2a2a2a] bg-[#1f1f1d] px-3 py-2.5 text-left transition-colors duration-200 ease-out hover:border-[#3a3a3a] hover:bg-[#242422]"
    >
      <p className="min-w-0 flex-1 text-[11px] font-semibold leading-snug text-[#d4d4d4] group-hover:text-[#ececec]">
        {cta.label}
      </p>
      <ExternalLink
        className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#5a5a5a] transition-colors group-hover:text-[#8a8a8a]"
        strokeWidth={2.25}
      />
    </a>
  );
}
