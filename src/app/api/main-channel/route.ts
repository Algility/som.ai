import fs from "fs";
import path from "path";
import { DATA_DIRS } from "@/lib/data-paths";
import { extractPreview, extractGuestFromTitle, sanitizeEpisodeTitle, extractTitleFromContent } from "@/lib/content-utils";

function loadMetadata(): Record<string, { youtube?: string; summary?: string; thumbnail?: string; guest?: string; date?: string; category?: string; title?: string }> {
  const metaPath = path.join(DATA_DIRS.mainChannel, "metadata.json");
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
  if (!fs.existsSync(DATA_DIRS.mainChannel)) return Response.json({ items: [], total: 0 });
  const dir = DATA_DIRS.mainChannel;

  const meta = loadMetadata();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".txt") && !f.startsWith(".") && f !== ".DS_Store");
  // Sort newest first (Acq-style: chronological, most recent first). Use metadata.date (ISO) or file mtime.
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

  const isNullPlaceholder = (name: string) => /^null\s*$/i.test(name) || /^null\s*\(\d+\)\s*$/i.test(name);
  const slice = sortedFiles.slice(offset, offset + limit);
  const items = slice.map((f) => {
    const title = f.replace(/\.txt$/, "");
    const entry = meta[title];
    const summary = entry?.summary;
    const youtube = entry?.youtube;
    const thumb = entry?.thumbnail;
    const needContentForPreview = !summary;
    const needContentForTitle = isNullPlaceholder(title) && !(typeof entry?.title === "string" && entry.title.trim());
    const content = needContentForPreview || needContentForTitle ? fs.readFileSync(path.join(dir, f), "utf-8").trim() : "";
    let displayTitle: string;
    if (typeof entry?.title === "string" && entry.title.trim()) {
      displayTitle = entry.title.trim();
    } else if (isNullPlaceholder(title)) {
      const fromContent = extractTitleFromContent(content);
      displayTitle = fromContent ?? sanitizeEpisodeTitle(title);
    } else {
      displayTitle = title;
    }
    const guest = typeof entry?.guest === "string" ? entry.guest.trim() : extractGuestFromTitle(title) ?? undefined;
    const category = typeof entry?.category === "string" ? entry.category.trim() : undefined;
    const image = thumb
      ? thumb.startsWith("http")
        ? thumb
        : `/main-channel/${thumb}`
      : undefined;
    const previewFromMeta = typeof summary === "string" ? summary.slice(0, 480) : null;
    if (previewFromMeta !== null) {
      return { title, displayTitle, guest, category, preview: previewFromMeta, summary, youtube, image };
    }
    const extracted = extractPreview(content);
    return { title, displayTitle, guest, category, preview: extracted || (previewFromMeta ?? ""), summary, youtube, image };
  });

  return Response.json({ items, total });
}
