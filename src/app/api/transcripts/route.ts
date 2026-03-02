import fs from "fs";
import path from "path";

function extractPreview(content: string, maxChars = 480): string {
  return content
    .split("\n")
    .map((l) =>
      l
        .replace(/^SPEAKER_\d+:\s*/i, "")
        .replace(/^\[[\d:,. ]+\]\s*/g, "")
        .replace(/^\d{2}:\d{2}(:\d{2})?\s*/g, "")
        .trim()
    )
    .filter((l) => l.length > 20)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .slice(0, maxChars)
    .trim();
}

function loadMetadata(): Record<string, { youtube?: string; summary?: string }> {
  const metaPath = path.join(process.cwd(), "src/data/transcripts/metadata.json");
  if (!fs.existsSync(metaPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch {
    return {};
  }
}

export async function GET() {
  const dir = path.join(process.cwd(), "src/data/transcripts");
  if (!fs.existsSync(dir)) return Response.json([]);

  const meta = loadMetadata();

  const items = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".txt"))
    .map((f) => {
      const title = f.replace(/\.txt$/, "");
      const content = fs.readFileSync(path.join(dir, f), "utf-8").trim();
      const preview = extractPreview(content);
      const youtube = meta[title]?.youtube;
      const summary = meta[title]?.summary;
      return { title, preview, summary, youtube };
    });

  return Response.json(items);
}
