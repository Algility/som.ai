import type { MessagePart } from "@/types/chat";
import type { ParsedPodcastTitle } from "@/types/content";

export function getMessageText(parts: unknown[]): string {
  return (parts as MessagePart[])
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

/** Remove emojis from titles for display. */
export function stripEmojis(s: string): string {
  return s
    .replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F?/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Extract YouTube video ID from short or long URL. */
export function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

/**
 * Parse speaker name from a podcast title.
 * Handles "Speaker on Topic", "Topic | Speaker", and "Topic  Speaker" formats.
 */
export function parsePodcast(title: string): ParsedPodcastTitle {
  const onMatch = title.match(/^(.+?)\s+on\s+(.+)$/i);
  if (onMatch) {
    const speaker = onMatch[1].trim();
    const topic = onMatch[2].trim();
    return { speaker, topic, initials: toInitials(speaker) };
  }
  const suffixMatch = title.match(/^(.+?)\s*(?:\||\s{2,})\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*$/);
  if (suffixMatch) {
    const topic = suffixMatch[1].trim();
    const speaker = suffixMatch[2].trim();
    return { speaker, topic, initials: toInitials(speaker) };
  }
  return { speaker: null, topic: title, initials: toInitials(title) };
}

function toInitials(value: string): string {
  return value
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Derive a chat title from the first user message. */
export function getChatTitle(msgs: Array<{ role: string; parts: unknown[] }>): string {
  const firstUser = msgs.find((m) => m.role === "user");
  if (!firstUser) return "New chat";
  const text = getMessageText(firstUser.parts);
  return text.length > 46 ? text.slice(0, 45) + "…" : text;
}

/** Strip asterisks during a live stream so users never see raw markdown. */
export function streamDisplayText(text: string, isStreaming: boolean): string {
  return isStreaming ? text.replace(/\*/g, "") : text;
}

export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
