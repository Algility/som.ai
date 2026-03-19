import { NextResponse } from "next/server";

/** Cache RSS responses so new uploads show up without hammering YouTube */
export const revalidate = 300;

/**
 * Resolve which channel to read for RSS merge.
 * - scope=main-channel → YOUTUBE_MAIN_CHANNEL_ID → YOUTUBE_CHANNEL_ID
 * - scope=podcasts → YOUTUBE_PODCAST_CHANNEL_ID → YOUTUBE_CHANNEL_ID2 → YOUTUBE_CHANNEL_ID
 * - no scope → YOUTUBE_CHANNEL_ID (legacy)
 *
 * So a two-line .env can be: YOUTUBE_CHANNEL_ID=… (main) + YOUTUBE_CHANNEL_ID2=… (podcasts).
 */
function channelIdForRequestScope(scope: string | null): string | undefined {
  const legacy = process.env.YOUTUBE_CHANNEL_ID?.trim();
  const legacy2 = process.env.YOUTUBE_CHANNEL_ID2?.trim();
  const main = process.env.YOUTUBE_MAIN_CHANNEL_ID?.trim();
  const podcast = process.env.YOUTUBE_PODCAST_CHANNEL_ID?.trim();
  if (scope === "main-channel") return main || legacy;
  if (scope === "podcasts") return podcast || legacy2 || legacy;
  return legacy;
}

/** Per <entry>: keep only long-form (alternate link is /watch?v=, not /shorts/) */
function extractLongFormVideoIdsFromAtom(xml: string): string[] {
  const parts = xml.split(/<entry>/i);
  const ids: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i] ?? "";
    const videoMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i);
    if (!videoMatch) continue;
    const shortLink =
      /<link[^>]*rel="alternate"[^>]*href="https:\/\/www\.youtube\.com\/shorts\//i.test(block) ||
      /<link[^>]*href="https:\/\/www\.youtube\.com\/shorts\/[^"]*"[^>]*rel="alternate"/i.test(block);
    if (shortLink) continue;
    ids.push(videoMatch[1]!);
  }
  return ids;
}

function dedupe(ids: string[]): string[] {
  const seen = new Set<string>();
  return ids.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * Latest long-form videos from a YouTube channel (public RSS — no API key).
 * 1) Try UULF playlist (no Shorts when YouTube exposes it).
 * 2) If that fails, use channel_id feed and drop entries whose alternate link is /shorts/.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");
  const channelId = channelIdForRequestScope(scope);
  if (!channelId) {
    return NextResponse.json({ items: [], source: "none" as const, scope: scope ?? undefined });
  }

  const headers = { "User-Agent": "SchoolOfMentors/1.0 (youtube-rss)" };

  try {
    const uulfId = channelId.startsWith("UC") ? "UULF" + channelId.slice(2) : channelId;
    const uulfUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(uulfId)}`;

    let res = await fetch(uulfUrl, {
      next: { revalidate },
      headers,
    });

    let xml: string;
    if (res.ok) {
      xml = await res.text();
    } else {
      const channelUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
      res = await fetch(channelUrl, {
        next: { revalidate },
        headers,
      });
      if (!res.ok) {
        return NextResponse.json({
          items: [],
          source: "error" as const,
          message: `YouTube feeds returned ${res.status}`,
        });
      }
      xml = await res.text();
    }

    const ids = dedupe(extractLongFormVideoIdsFromAtom(xml));

    return NextResponse.json({
      items: ids.map((id) => ({ id })),
      source: "youtube-rss" as const,
      scope: scope ?? undefined,
    });
  } catch (e) {
    console.error("[youtube-channel-videos]", e);
    return NextResponse.json({
      items: [],
      source: "error" as const,
      message: e instanceof Error ? e.message : "fetch failed",
    });
  }
}
