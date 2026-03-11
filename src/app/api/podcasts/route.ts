import fs from "fs";
import path from "path";
import { DATA_DIRS } from "@/lib/data-paths";
import { extractPreview } from "@/lib/content-utils";

function loadMetadata(): Record<string, { youtube?: string; summary?: string; date?: string; category?: string; title?: string }> {
  const metaPath = path.join(DATA_DIRS.podcasts, "metadata.json");
  if (!fs.existsSync(metaPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch {
    return {};
  }
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(req: Request) {
  if (!fs.existsSync(DATA_DIRS.podcasts)) return Response.json({ items: [], total: 0 });
  const dir = DATA_DIRS.podcasts;

  const meta = loadMetadata();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".txt"));
  // Sort newest first (Acq-style: chronological). Use metadata.date (ISO) or file mtime.
  const withSortKey = files.map((f) => {
    const title = f.replace(/\.txt$/, "");
    const metaDate = meta[title]?.date;
    const sortKey = metaDate ? new Date(metaDate).getTime() : fs.statSync(path.join(dir, f)).mtimeMs;
    return { file: f, sortKey };
  });
  withSortKey.sort((a, b) => b.sortKey - a.sortKey);
  const sortedFiles = withSortKey.map((x) => x.file);
  const total = sortedFiles.length;

  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)));

  const slice = sortedFiles.slice(offset, offset + limit);
  const items = slice.map((f) => {
    const title = f.replace(/\.txt$/, "");
    const entry = meta[title];
    const summary = entry?.summary;
    const youtube = entry?.youtube;
    const displayTitle = typeof entry?.title === "string" && entry.title.trim() ? entry.title.trim() : title;
    const category = typeof entry?.category === "string" ? entry.category.trim() : undefined;
    const preview = typeof summary === "string" ? summary.slice(0, 480) : null;
    if (preview !== null) {
      return { title, displayTitle, category, preview, summary, youtube };
    }
    const content = fs.readFileSync(path.join(dir, f), "utf-8").trim();
    const extracted = extractPreview(content);
    return { title, displayTitle, category, preview: extracted, summary, youtube };
  });

  return Response.json({ items, total });
}
