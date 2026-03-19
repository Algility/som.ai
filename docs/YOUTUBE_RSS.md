# YouTube RSS merge (Podcasts + Main channel)

The app can merge **your curated lists** in `src/data/podcast-episodes.ts` and `src/data/main-channel-videos.ts` with **new uploads** from YouTube using public RSS (no API key).

## Environment variables

| Variable | Used for |
|----------|-----------|
| `YOUTUBE_MAIN_CHANNEL_ID` | **Main channel** page (optional; overrides next row for main only). |
| `YOUTUBE_CHANNEL_ID` | **Main channel** RSS when `YOUTUBE_MAIN_CHANNEL_ID` is unset. Also legacy single-channel fallback. |
| `YOUTUBE_PODCAST_CHANNEL_ID` | **Podcasts** page (optional; overrides `YOUTUBE_CHANNEL_ID2`). |
| `YOUTUBE_CHANNEL_ID2` | **Podcasts** RSS when set and `YOUTUBE_PODCAST_CHANNEL_ID` is unset. |

### Two channels (simple `.env` names)

```env
YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxxxx
YOUTUBE_CHANNEL_ID2=UCyyyyyyyyyyyyyyyyyyyyyy
```

First id = **Main channel** merge; second = **Podcasts** merge.

### Two channels (explicit names)

```env
YOUTUBE_MAIN_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxxxx
YOUTUBE_PODCAST_CHANNEL_ID=UCyyyyyyyyyyyyyyyyyyyyyy
```

### Single channel (legacy)

If both pages should follow the same channel:

```env
YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxxxx
```

## “Not saving” / order looks wrong

- The **grid order** is not stored in a database. It comes from:
  1. YouTube RSS (newest first) when env is set, **merged into**
  2. Your static list in the `src/data/*.ts` files (commit those to git).
- If **Main channel** matched **Podcasts**, you likely had only `YOUTUBE_CHANNEL_ID` set — both pages used the **same** feed. Set **`YOUTUBE_MAIN_CHANNEL_ID`** and **`YOUTUBE_PODCAST_CHANNEL_ID`** to split them.

## API

- `GET /api/youtube-channel-videos?scope=main-channel`
- `GET /api/youtube-channel-videos?scope=podcasts`
