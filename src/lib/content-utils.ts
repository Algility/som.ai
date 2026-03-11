/**
 * Single source of truth for transcript content format.
 * Used for: AI context (clean prose), list previews, and any display of episode text.
 */

/** Strip timestamps and speaker labels from one line. */
function normalizeLine(line: string): string {
  return line
    .replace(/^\s*\[\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?\]\s*/i, "")
    .replace(/^\s*\[\d[\d:,. ]+\]\s*/g, "")
    .replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?\s+/i, "")
    .replace(/^SPEAKER_\d+:\s*/i, "")
    .trim();
}

/**
 * Normalize full transcript content for the model: strip timestamps, speaker labels,
 * collapse whitespace → clean prose. Use for all context sent to the LLM.
 */
export function normalizeTranscriptContent(raw: string): string {
  return raw
    .split("\n")
    .map(normalizeLine)
    .filter((l) => l.length > 0)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Extract a short preview for list/hover: same normalization, then take first maxChars.
 * Skips very short lines (e.g. "00:00 a") to keep preview readable.
 */
export function extractPreview(content: string, maxChars = 480): string {
  const lines = content
    .split("\n")
    .map(normalizeLine)
    .filter((l) => l.length > 20);
  return lines
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .slice(0, maxChars)
    .trim();
}

/**
 * Try to extract entrepreneur/guest full name from main-channel title for "Name — Episode" display.
 * Tries common patterns; returns null if none match. Prefer metadata.json "guest" when available.
 */
export function extractGuestFromTitle(title: string): string | null {
  const t = title.trim();
  // "Young Entrepreneur Interviews Tom Brady"
  const ye = /^Young Entrepreneur Interviews\s+(.+)$/i.exec(t);
  if (ye?.[1]) return ye[1].trim();

  // "I Asked Will Smith How He Made..." / "I Asked X How He Got..." / "I Asked X How They..."
  const asked = /^I Asked\s+(.+?)\s+How\s+(?:He|She|They|I)\s+/i.exec(t);
  if (asked?.[1]) return asked[1].trim();

  // "10 Questions with a Millionaire ... Name" — name often at end (e.g. "Grant Mitt", "Lavon Perrin")
  const q = /^10 Questions with [^.]+?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/i.exec(t);
  if (q?.[1]) return q[1].trim();

  // "Interview with X" / "Exclusive Interview with X"
  const iv = /^(?:Exclusive\s+)?Interview with\s+(.+?)(?:\s+Life Lessons|\s+Advice|$)/i.exec(t);
  if (iv?.[1]) return iv[1].trim();

  // "Ft Name" / "Featuring Name" (e.g. "Ft Alex Hormozi's Closer Jacob Hopkins" → keep "Jacob Hopkins" or full "Alex Hormozi's Closer Jacob Hopkins")
  const ft = /\b(?:Ft\.?|Featuring)\s+(.+?)(?:\s+[A-Z][a-z]+'s\s+Closer\s+)?([A-Z][a-z]+\s+[A-Z][a-z]+)?$/i.exec(t);
  if (ft?.[2]) return ft[2].trim(); // "Jacob Hopkins"
  if (ft?.[1]) return ft[1].trim();

  return null;
}

/**
 * Format main-channel display: "Full Name — Episode title" when guest is set; otherwise title.
 * Strips the guest name from the end of title when present to avoid "Name — ... Name".
 */
export function formatMainChannelTitle(title: string, guest: string | null | undefined): string {
  if (!guest?.trim()) return title;
  const g = guest.trim();
  const withoutGuestAtEnd = title.replace(new RegExp(`\\s*${g.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "").trim();
  return `${g}: ${withoutGuestAtEnd}`;
}

/** Replace "null" / "null (n)" / "null ()" placeholder titles for display. Use metadata.title when you have the real title. */
export function sanitizeEpisodeTitle(title: string): string {
  if (!title || title.trim() === "") return "Untitled";
  const t = title.trim();
  if (/^null\s*$/i.test(t)) return "Untitled";
  if (/^null\s*\(\s*\)\s*$/i.test(t)) return "Untitled"; // "null ()" → "Untitled"
  const match = t.match(/^null\s*\((\d+)\)\s*$/i);
  return match ? `Untitled (${match[1]})` : title;
}

/** Try to derive a display title from transcript content (first meaningful phrase, timestamps stripped). Returns null if empty or nothing good. */
export function extractTitleFromContent(content: string): string | null {
  if (!content || !content.trim()) return null;
  const normalized = content
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*\[\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?\]\s*/i, "")
        .replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?\s+/i, "")
        .replace(/^SPEAKER_\d+:\s*/i, "")
        .trim()
    )
    .filter((l) => l.length > 0)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (normalized.length < 15) return null;
  const maxLen = 80;
  const chunk = normalized.slice(0, maxLen);
  const lastSpace = chunk.lastIndexOf(" ");
  const title = lastSpace > 40 ? chunk.slice(0, lastSpace) : chunk;
  return title.trim() || null;
}
