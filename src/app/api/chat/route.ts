import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import fs from "fs";
import path from "path";
import { DATA_DIRS } from "@/lib/data-paths";
import { normalizeTranscriptContent } from "@/lib/content-utils";
import { ChatRequestSchema, parseJsonBody } from "@/lib/api-schemas";

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
  date?: string;
  guest?: string;
  title?: string;
  duration?: string;
  call_number?: string;
}

type TranscriptSource =
  | "mentor-session"
  | "call-recording"
  | "main-channel"
  | "podcast";

interface Transcript {
  title: string;
  content: string;
  keywords: string[];
  youtube?: string;
  source: TranscriptSource;
  date?: string;
  /** Parsed date as a unix millisecond timestamp for sorting. 0 if unknown. */
  dateTs: number;
}

const SKIP_WORDS = new Set(["the", "and", "with", "for", "from", "that", "this", "how", "why", "his", "her", "him"]);

/** Lenient date parser for formats like "June 6th, 2024" or "January 08, 2025". */
function parseCallDate(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/(\d+)(st|nd|rd|th)/gi, "$1");
  const ts = Date.parse(cleaned);
  return Number.isFinite(ts) ? ts : 0;
}

function loadFromDir(dir: string, source: TranscriptSource): Transcript[] {
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
      const metaEntry = meta[title] ?? {};
      const date = metaEntry.date;
      return {
        title,
        content,
        keywords,
        youtube: metaEntry.youtube,
        source,
        date,
        dateTs: parseCallDate(date),
      };
    });
}

// Mentor sessions are the primary live content source surfaced in the
// sidebar (locked tabs). Main channel YouTube videos and podcasts are loaded
// "subtly" — the AI references them in answers but they have no UI presence.
// Call recordings stay wired for future use but are ignored until the
// directory contains files.
const MENTOR_SESSIONS = loadFromDir(DATA_DIRS.mentorSessions, "mentor-session");
const CALL_RECORDINGS = loadFromDir(DATA_DIRS.callRecordings, "call-recording");
const MAIN_CHANNEL = loadFromDir(DATA_DIRS.mainChannel, "main-channel");
const PODCASTS = loadFromDir(DATA_DIRS.podcasts, "podcast");
const TRANSCRIPTS = [
  ...MENTOR_SESSIONS,
  ...CALL_RECORDINGS,
  ...MAIN_CHANNEL,
  ...PODCASTS,
].sort((a, b) => b.dateTs - a.dateTs);

/**
 * Compact index of every mentor session, sorted newest first, injected into
 * the system prompt so the model can answer "which sessions are available?"
 * or "what's the most recent?" without relying on keyword retrieval.
 */
const MENTOR_SESSION_INDEX = (() => {
  const sessions = TRANSCRIPTS.filter((t) => t.source === "mentor-session");
  if (sessions.length === 0) return "";
  const latest = sessions[0];
  const latestLine = latest
    ? `The most recent mentor session is "${latest.title}"${
        latest.date ? ` recorded ${latest.date}` : ""
      }.`
    : "";
  const lines = sessions.map((t) => {
    const date = t.date ? `(${t.date})` : "";
    return `  - ${t.title} ${date}`.trim();
  });
  return `\n\n## Mentor session index (${sessions.length} sessions, newest first)\n\n${latestLine}\n\n${lines.join("\n")}\n\nWhen the user asks which sessions are available, the most recent one, who the last guest was, or for a chronological overview, use this index as the source of truth. Do not invent session names or dates.`;
})();

const TRANSCRIPT_TITLES =
  TRANSCRIPTS.length > 0
    ? `\n\nYou have access to mentor content from the School of Mentors community across four sources: ${
        TRANSCRIPTS.filter((t) => t.source === "mentor-session").length
      } mentor sessions, ${
        TRANSCRIPTS.filter((t) => t.source === "main-channel").length
      } main channel YouTube videos, ${
        TRANSCRIPTS.filter((t) => t.source === "podcast").length
      } podcast episodes, and ${
        TRANSCRIPTS.filter((t) => t.source === "call-recording").length
      } call recordings. Relevant excerpts will be injected below when the user's question matches. Context labels:\n- "Mentor Session:" means a live community session. Refer to it as "the mentor session", "this session", or "the session with [guest name]".\n- "Video:" means a School of Hard Knocks YouTube video from the main channel. Refer to it as "the YouTube video" or "the [guest name] video". Never call it a podcast.\n- "Podcast:" means a podcast episode. Call it "the podcast" or "the episode".\n- "Call Recording:" means a recorded mentor call. Refer to it as "the call" or "this recorded call".\nNever use "transcript", "document", or "text" when referring to any of these. Do not invent session names, video titles, or guests. Use only the content provided.${MENTOR_SESSION_INDEX}`
    : "";

function labelForSource(source: TranscriptSource): string {
  switch (source) {
    case "call-recording":
      return "Call Recording";
    case "mentor-session":
      return "Mentor Session";
    case "main-channel":
      return "Video";
    case "podcast":
      return "Podcast";
  }
}

const BASE_SYSTEM_PROMPT = `You are School of Mentors AI, the user's personal AI business advisor and strategic co-pilot. You give implementation, not just information. Execution ready next steps and ROI focused insight, grounded in the mentor content you have access to. You cover business strategy, sales, mindset, call recordings, mentor sessions, projects, and personal development. Think like a top tier advisor. Actionable and specific, not generic.

Voice:
A sharp mentor who has their back. Natural, human, confident. No corporate speak, no robot vibes, no self help platitudes. Implementation focused. Every response points to something the user can actually do. Prefer scripts, playbooks, specific numbers, and concrete steps over theory. Ground answers in the mentor content when relevant, weaving it in naturally like a friend who just finished watching the video.

Answer the question. Don't dance around it:
Lead with your answer, not a setup. The first sentence is the actual point. Never open with "it depends", "great question", "that's a good question", "certainly", "absolutely", "of course", or any filler. Do not ask clarifying questions unless the request is genuinely ambiguous and you cannot give a useful default. In nearly every case, give your best answer for the common situation and let the user push back if they need to. Do not end with a question. When you're done, stop. No "does that help", no "what's your situation", no "is there anything else".

Structure. Pure clean prose:
Write in flowing paragraphs only. No headers. No bullet points. No numbered lists. No bold or italic formatting. Separate ideas with empty lines between paragraphs. Pick the most likely scenario, commit to it, and answer that. Never split an answer into "if A, if B" branches. Be concise. Cut every word that isn't doing work. A sharp two paragraph answer beats a hedged five paragraph one.

Absolutely no symbols or special characters in your output:
No hyphens or dashes anywhere. Write "20 to 30" instead of "20-30". Write "top tier" instead of "top-tier". Write "execution ready" instead of "execution-ready".
No em-dashes. Use a period, comma, or parentheses instead.
No asterisks, no underscores, no backticks, no hash signs, no angle brackets, no arrows, no bullets.
No markdown whatsoever. Your output is plain prose.
No emojis.
No trailing pleasantries.
The only punctuation you use: period, comma, question mark, colon, semicolon, parentheses, apostrophe, and quotation marks.

Referencing content:
If the context is labeled "Video:", call it a "YouTube video" (for example, "this YouTube video", "the Tom Brady YouTube video"). Never call it a podcast or music video. If labeled "Podcast:", call it the "podcast" or "episode". If labeled "Call Recording:", call it "the call" or "this recorded call". If labeled "Mentor Session:", call it "the mentor session" or "this session". Never use "transcript", "document", or "text". Talk as if you watched the video or were in the session. When quoting or summarizing, use clean prose. No timestamps, speaker IDs, or raw transcript artifacts.${TRANSCRIPT_TITLES}`;

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

interface UiMessage {
  role: string;
  content?: unknown;
  parts?: Array<{ type?: string; text?: string }>;
}

function extractUserText(m: UiMessage): string {
  // AI SDK UI messages use `parts`, legacy shape uses `content`.
  if (Array.isArray(m.parts)) {
    return m.parts
      .filter((p) => p?.type === "text")
      .map((p) => p?.text ?? "")
      .join(" ");
  }
  if (typeof m.content === "string") return m.content;
  if (Array.isArray(m.content)) {
    return (m.content as Array<{ type?: string; text?: string }>)
      .filter((p) => p?.type === "text")
      .map((p) => p?.text ?? "")
      .join(" ");
  }
  return "";
}

function getRelevantContext(messages: UiMessage[]): string {
  if (TRANSCRIPTS.length === 0) return "";

  const recentUserText = messages
    .filter((m) => m.role === "user")
    .slice(-3)
    .map(extractUserText)
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
    const label = labelForSource(t.source);
    const block = `=== ${label}: ${t.title} ===\n${normalizeTranscriptContent(chunks)}`;
    if (totalLen + block.length > MAX_CONTEXT_CHARS) break;
    sections.push(block);
    totalLen += block.length;
  }

  return `\n\n## Relevant excerpts\n\n${sections.join("\n\n")}`;
}

export async function POST(req: Request) {
  let body;
  try {
    body = await parseJsonBody(req, ChatRequestSchema);
  } catch (res) {
    return res as Response;
  }
  const { messages, model, transcript } = body;
  const modelId = (model && MODEL_MAP[model]) ?? "claude-sonnet-4-6";

  let transcriptContext = "";
  const uiMessages = messages as UiMessage[];
  if (transcript) {
    const found = TRANSCRIPTS.find((t) => t.title === transcript);
    if (found) {
      const lastUser = [...uiMessages].reverse().find((m) => m.role === "user");
      const query = (lastUser && extractUserText(lastUser)) || found.title;
      const chunks = retrieveChunks(found.content, query);
      const label = labelForSource(found.source);
      transcriptContext = `\n\n## ${label}: ${found.title}\n\n${normalizeTranscriptContent(chunks)}`;
    }
  } else {
    transcriptContext = getRelevantContext(uiMessages);
  }

  const systemPrompt = BASE_SYSTEM_PROMPT + transcriptContext;

  const result = streamText({
    model: anthropic(modelId),
    system: systemPrompt,
    messages: await convertToModelMessages(messages as UIMessage[]),
  });

  return result.toUIMessageStreamResponse();
}
