/** YouTube watch / short / youtu.be → embed URL for iframe. */
export function toVideoEmbedUrl(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const u = raw.trim();
  if (u.includes("youtube.com/embed/")) return u.split("&")[0] ?? u;
  const watch = u.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  const shorts = u.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
  return null;
}

/** Embed URL with controls visible and inline playback (native YouTube play button). */
export function landingVslIframeSrc(embedUrl: string): string {
  try {
    const url = new URL(embedUrl.startsWith("http") ? embedUrl : `https://${embedUrl}`);
    url.searchParams.set("rel", "0");
    url.searchParams.set("controls", "1");
    url.searchParams.set("playsinline", "1");
    return url.toString();
  } catch {
    const sep = embedUrl.includes("?") ? "&" : "?";
    return `${embedUrl}${sep}rel=0&controls=1&playsinline=1`;
  }
}
