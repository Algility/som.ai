import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages } from "ai";
import fs from "fs";
import path from "path";
import { DATA_DIRS } from "@/lib/data-paths";
import { normalizeTranscriptContent } from "@/lib/content-utils";

export const maxDuration = 30;

/** Maps SOM AI model ids (see src/lib/som-models.ts) to provider model ids. */
const MODEL_MAP: Record<string, string> = {
  advisor: "claude-opus-4-5",
  standard: "claude-sonnet-4-6",
  quick: "claude-haiku-4-5-20251001",
  // Legacy ids still supported
  "opus-4.5": "claude-opus-4-5",
  "sonnet-4.5": "claude-sonnet-4-6",
  "haiku-4.5": "claude-haiku-4-5-20251001",
};

interface TranscriptMeta {
  youtube?: string;
}

interface Transcript {
  title: string;
  content: string;
  keywords: string[];
  youtube?: string;
}

const SKIP_WORDS = new Set(["the", "and", "with", "for", "from", "that", "this", "how", "why", "his", "her", "him"]);

function loadFromDir(dir: string): Transcript[] {
  if (!fs.existsSync(dir)) return [];

  const metaPath = path.join(dir, "metadata.json");
  let meta: Record<string, TranscriptMeta> = {};
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch {
      /* ignore */
    }
  }

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".txt") && !f.startsWith("."))
    .map((file) => {
      const title = file.replace(/\.txt$/, "");
      const content = fs.readFileSync(path.join(dir, file), "utf-8").trim();
      const keywords = title
        .toLowerCase()
        .split(/[\s,&$#@!?.'"–—]+/)
        .filter((w) => w.length >= 3 && !SKIP_WORDS.has(w));
      const youtube = meta[title]?.youtube;
      return { title, content, keywords, youtube };
    });
}

// Main channel + podcasts — merged for chat context (both under src/data)
const TRANSCRIPTS = [...loadFromDir(DATA_DIRS.mainChannel), ...loadFromDir(DATA_DIRS.podcasts)];

const TRANSCRIPT_TITLES =
  TRANSCRIPTS.length > 0
    ? `\n\nYou have access to many episodes (${TRANSCRIPTS.length}+). When the user picks one or asks about a topic, relevant transcript context will be included below. Do not list or guess episode titles — use only the context provided.`
    : "";

const BASE_SYSTEM_PROMPT = `You are the School of Mentors AI — the user's personal AI business advisor and strategic co-pilot. You give implementation, not just information: execution-ready next steps and ROI-focused insight grounded in the mentor content and episodes you have access to. You cover business strategy, sales, mindset, call recordings, mentor sessions, projects, and personal development. Think like a top-tier advisor: actionable and specific, not generic.

Tone and style:
- Talk like a sharp mentor who has their back. Natural, human, no corporate-speak or robot vibes.
- Be implementation-focused: when you give advice, make it actionable (what to do next, how to apply it). Prefer execution-ready assets (scripts, playbooks, steps) over theory. Ground answers in the episodes and content when relevant.
- Never start a response with "Certainly", "Great question", "Of course", "Absolutely", or any filler affirmation.
- Don't over-structure simple answers. Quick question → direct answer. Use bullets or headers only when they actually make things clearer (e.g. steps, comparisons).
- Be concise. No padding, no throat-clearing. Say what matters.
- Never end with "Is there anything else I can help you with?" or similar. When you're done, just stop.
- No emojis.
- When referencing content from a podcast or episode, call it the "podcast" or "episode" — never "transcript", "document", or "text". Talk as if you listened to it. When quoting or summarizing, use clean prose only (no timestamps or speaker IDs).${TRANSCRIPT_TITLES}`;

// Pull only the chunks of a transcript most relevant to the query.
// Keeps token usage under ~5K even for large transcripts.
function retrieveChunks(content: string, query: string, maxChars = 16000): string {
  const queryWords = new Set(
    query.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  );

  const lines = content.split("\n").filter((l) => l.trim());
  const CHUNK = 15; // lines per chunk

  const scored: { text: string; score: number; index: number }[] = [];
  for (let i = 0; i < lines.length; i += CHUNK) {
    const text = lines.slice(i, i + CHUNK).join(" ");
    const lower = text.toLowerCase();
    const score = [...queryWords].filter((w) => lower.includes(w)).length;
    scored.push({ text, score, index: i });
  }

  // Take top-scoring chunks, restore original order, cap total size
  const top = scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 24)
    .sort((a, b) => a.index - b.index);

  // Fall back to the opening ~200 lines if nothing matched
  if (top.length === 0) {
    return lines.slice(0, 200).join(" ");
  }

  let result = "";
  for (const { text } of top) {
    if (result.length + text.length > maxChars) break;
    result += text + "\n\n";
  }
  return result.trim();
}

function getRelevantContext(messages: { role: string; content: unknown }[]): string {
  if (TRANSCRIPTS.length === 0) return "";

  const recentUserText = messages
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => {
      if (typeof m.content === "string") return m.content;
      if (Array.isArray(m.content)) {
        return m.content
          .filter((p: { type: string }) => p.type === "text")
          .map((p: { text: string }) => p.text)
          .join(" ");
      }
      return "";
    })
    .join(" ");

  const lower = recentUserText.toLowerCase();

  // Find transcripts whose title keywords appear in the user's message; limit to top 5 to cap context size
  const MAX_TRANSCRIPTS = 5;
  const MAX_CONTEXT_CHARS = 24000;

  const matches = TRANSCRIPTS.filter((t) =>
    t.keywords.some((kw) => lower.includes(kw))
  )
    .map((t) => ({
      ...t,
      score: t.keywords.filter((kw) => lower.includes(kw)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_TRANSCRIPTS);

  if (matches.length === 0) return "";

  let totalLen = 0;
  const sections: string[] = [];
  for (const t of matches) {
    const chunks = retrieveChunks(t.content, recentUserText, Math.floor((MAX_CONTEXT_CHARS - totalLen) / matches.length));
    const block = `=== ${t.title} ===\n${normalizeTranscriptContent(chunks)}`;
    if (totalLen + block.length > MAX_CONTEXT_CHARS) break;
    sections.push(block);
    totalLen += block.length;
  }

  return `\n\n## Relevant episode excerpts\n\n${sections.join("\n\n")}`;
}

export async function POST(req: Request) {
  const { messages, model, transcript } = await req.json();
  const modelId = MODEL_MAP[model] ?? "claude-sonnet-4-6";

  let transcriptContext = "";
  if (transcript) {
    // User selected a specific podcast — force-include it
    const found = TRANSCRIPTS.find((t) => t.title === transcript);
    if (found) {
      const lastUser = [...messages].reverse().find((m: { role: string }) => m.role === "user");
      const query =
        typeof lastUser?.content === "string"
          ? lastUser.content
          : Array.isArray(lastUser?.content)
          ? lastUser.content.filter((p: { type: string }) => p.type === "text").map((p: { text: string }) => p.text).join(" ")
          : found.title;
      const chunks = retrieveChunks(found.content, query);
      transcriptContext = `\n\n## Episode: ${found.title}\n\n${normalizeTranscriptContent(chunks)}`;
    }
  } else {
    transcriptContext = getRelevantContext(messages);
  }

  const systemPrompt = BASE_SYSTEM_PROMPT + transcriptContext;

  const result = streamText({
    model: anthropic(modelId),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
