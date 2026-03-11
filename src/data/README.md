# Content data (Next.js best practice)

All episode and transcript content lives here so API routes stay thin and data is in one place.

- **`main-channel/`** — Main channel episodes (200+). One `.txt` per episode. Optional `metadata.json` per **filename** (key = filename without `.txt`): `youtube`, `summary`, `thumbnail`, `guest`, `date` (ISO), `category`, and **`title`** (display title — use this when the filename is a placeholder like `null (2).txt` so the list and chat show your real episode title). Thumbnail images go in **`public/main-channel/`** or use a full URL. Sorted newest first.
- **`podcasts/`** — Same: `.txt` files + optional `metadata.json` with `youtube`, `summary`, `date`, `category`, and **`title`** for display. Sorted newest first.

API routes under `src/app/api/` only read from these paths (see `src/lib/data-paths.ts`).

**Example: real titles for placeholder filenames** — If you have files like `null (2).txt` with no content yet, add `src/data/main-channel/metadata.json` and set a `title` so the app shows your real episode name:

```json
{
  "null (2)": { "title": "Your Real Episode Title Here", "youtube": "https://youtube.com/watch?v=..." },
  "null (3)": { "title": "Another Episode Name" }
}
```

The key must match the filename without `.txt`. The list and chat will use `title` for display; the file key is still used for lookups.

## Transcript format (best for AI and display)

The app accepts any plain-text transcript; these formats are normalized before being sent to the model:

- **Timestamped lines** — `00:00` or `00:01:30` or `[00:00:00]` at the start of a line are stripped so the model sees clean prose.
- **Speaker labels** — `SPEAKER_01:` (or `SPEAKER_1:`) at the start of a line are stripped. For multi-speaker, you can use `Speaker name:` and we strip generic `SPEAKER_N:` only.
- **Plain paragraphs** — No prefix; text is used as-is.

**Recommended:** One segment per line (timestamp and/or speaker optional). Empty lines are collapsed. The AI receives normalized text (no timestamps or speaker IDs) so answers and quotes stay clean. List previews use the first ~480 characters of normalized text. Normalization is implemented in `src/lib/content-utils.ts` (used by chat and list APIs).
