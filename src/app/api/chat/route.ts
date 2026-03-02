import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages } from "ai";
import fs from "fs";
import path from "path";

export const maxDuration = 30;

const MODEL_MAP: Record<string, string> = {
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

function loadMetadata(): Record<string, TranscriptMeta> {
  const metaPath = path.join(process.cwd(), "src/data/transcripts/metadata.json");
  if (!fs.existsSync(metaPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch {
    return {};
  }
}

function loadTranscripts(): Transcript[] {
  const dir = path.join(process.cwd(), "src/data/transcripts");
  if (!fs.existsSync(dir)) return [];

  const meta = loadMetadata();
  const skip = new Set(["the", "and", "with", "for", "from", "that", "this", "how", "why", "his", "her", "him"]);

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".txt"))
    .map((file) => {
      const title = file.replace(/\.txt$/, "");
      const content = fs.readFileSync(path.join(dir, file), "utf-8").trim();
      const keywords = title
        .toLowerCase()
        .split(/[\s,&$#@!?.'"–—]+/)
        .filter((w) => w.length >= 3 && !skip.has(w));
      const youtube = meta[title]?.youtube;
      return { title, content, keywords, youtube };
    });
}

const TRANSCRIPTS = loadTranscripts();

const TRANSCRIPT_TITLES =
  TRANSCRIPTS.length > 0
    ? `\n\nAvailable transcripts you can reference:\n${TRANSCRIPTS.map((t) => `- ${t.title}`).join("\n")}`
    : "";

const BASE_SYSTEM_PROMPT = `You are the School of Mentors AI — a sharp, experienced advisor for members of the School of Mentors program. You think and communicate like a top-tier business mentor: direct, confident, and real. You cover business strategy, sales, mindset, call recordings, mentor sessions, projects, and personal development.

Tone and style:
- Talk like a knowledgeable person, not a robot. Use natural language, not corporate-speak.
- Never start a response with "Certainly", "Great question", "Of course", "Absolutely", or any filler affirmation.
- Don't over-structure simple answers. If someone asks a quick question, give a direct answer — no need for headers and bullet points every time.
- Use formatting (bullets, bold, headers) only when it genuinely makes the content clearer, like step-by-step instructions or comparisons. Not for every response.
- Be concise. Cut anything that doesn't add value. No padding, no throat-clearing.
- When giving advice, be specific and actionable. Vague encouragement is useless.
- Never end a response with "Is there anything else I can help you with?" or any variation of that. If the answer is complete, just stop.
- No emojis.
- When referencing content from a podcast, always call it the "podcast" or "episode" — never say "transcript", "document", or "text". Talk as if you listened to it, not read it.${TRANSCRIPT_TITLES}`;

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

  // Find transcripts whose title keywords appear in the user's message
  const matches = TRANSCRIPTS.filter((t) =>
    t.keywords.some((kw) => lower.includes(kw))
  );

  if (matches.length === 0) return "";

  const sections = matches.map((t) => {
    const chunks = retrieveChunks(t.content, recentUserText);
    return `=== ${t.title} ===\n${chunks}`;
  });

  return `\n\n## Relevant Transcript Excerpts\n\n${sections.join("\n\n")}`;
}

export async function POST(req: Request) {
  const { messages, model, transcript } = await req.json();
  const modelId = MODEL_MAP[model] ?? "claude-haiku-4-5-20251001";

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
      transcriptContext = `\n\n## Transcript: ${found.title}\n\n${chunks}`;
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
