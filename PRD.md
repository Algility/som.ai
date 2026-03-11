# Product Requirements Document: School of Mentors AI

**Version:** 1.0  
**Purpose:** Cloneable spec to rebuild or fork the app.  
**Tagline:** Your personal AI business advisor. Implementation-focused answers grounded in your mentors and content.

---

## 1. Product overview

### 1.1 Vision

A single-page app where users chat with an AI trained on their own video/podcast transcripts (main channel + podcasts). The AI acts as a **personal mentor and strategic co-pilot**: implementation-focused, actionable, and grounded in the user’s content—not generic advice. Inspired by the “advisor + content” pattern (e.g. Acq AI).

### 1.2 Core value

- **One place** for main channel episodes and podcast episodes.
- **Chat with context**: pick an episode (or ask openly) and get answers grounded in that content.
- **Execution over information**: answers should be specific, with next steps (scripts, playbooks, steps), not just theory.
- **YouTube linking**: episodes can link to source videos; chat shows a “Watch on YouTube” pill when available.

### 1.3 User persona

- Creator/entrepreneur who has a library of video/podcast transcripts.
- Wants to query that library via natural language and get advice that references specific episodes.
- May use Supabase auth; optional localStorage fallback for chat history when no auth.

---

## 2. Features (scope for clone)

### 2.1 Navigation and layout

- **Left sidebar (collapsible on mobile)**
  - Logo + “School of Mentors” branding.
  - Nav: Home/Chat, Recordings, Main channel (YouTube icon), Podcasts, Settings.
  - Recents: list of past conversations (from Supabase or localStorage), search, rename, delete.
  - Profile area: avatar, name, email, sign out; optional Settings shortcut.
- **Main content area**
  - Single dynamic view: Home | Chat | Main channel | Podcasts | Call Recordings | Mentor Sessions | Settings.
- **Top bar (in chat)**
  - Back/sidebar toggle, center title (episode name or view name), new-chat button.
- **Mobile:** sidebar overlay; top bar shows current view/selected episode.

### 2.2 Home view

- Greeting: “Good morning/afternoon/evening, {firstName}”.
- Chat input (same as in chat view) to send a message and start a thread.
- Quick links: Main channel, Call Recordings, Mentor Sessions, Podcasts, Resources (each navigates or sends a prompt).

### 2.3 Chat view

- Message list: user and assistant bubbles; assistant has copy button.
- When a conversation was started from an episode: show a **source pill** under the first assistant message with “Watch on YouTube” (if `youtube` URL exists), episode title, and optional hover card (thumbnail, title, CTA).
- Chat header shows selected episode name (or “Episode”) when in context.
- Model selector and send/stop in input area.
- Messages stream in (no typewriter; throttle for performance).

### 2.4 Main channel view

- Title: “Main channel”; subtitle: “Pick an episode for actionable advice. {N} episodes”.
- Search input to filter by title, guest, category, display title.
- **List of episodes** (paginated, e.g. 50 per page, “Load more”):
  - Row: thumbnail or YouTube icon (left), title (and optional category line), chevron.
  - Click row → set selected episode, go to chat, send a default prompt (e.g. key takeaways).
- **Sort:** newest first (by `metadata.date` or file mtime).
- **Display title:** from `metadata.title` if set; else from filename; for placeholder filenames (e.g. `null (2).txt`), optionally derive title from first phrase of transcript content.
- **Animations:** staggered fade-in + slide-up for list rows; smooth scroll; optional custom scrollbar.

### 2.5 Podcasts view

- Same idea as main channel: list of podcast episodes (from `src/data/podcasts/`).
- Card layout: avatar (or initials), speaker/topic (parsed from title or metadata), summary/preview, “Load more”.
- Search by title, speaker, topic, category.
- Click → start chat with that episode as context.

### 2.6 Call Recordings / Mentor Sessions

- Placeholder/empty-state views with icon and short copy (e.g. “No call recordings yet”).
- Structure ready for future data (e.g. another folder or API).

### 2.7 Settings view

- User profile: name, email, avatar (with upload), optional theme.
- Section for “Mentor Sessions” and other future settings.

### 2.8 Auth (optional)

- Supabase Auth: sign in, sign up, forgot password, confirm.
- When Supabase is configured: chat history and profile stored in Supabase; `chats` table (client_chat_id, title, messages, transcript, user_id, updated_at).
- When Supabase is not configured: chat history in localStorage only; no persistence of profile across devices.

---

## 3. Content and data model

### 3.1 Transcript content (required to clone)

- **Locations (Next.js best practice)**
  - `src/data/main-channel/` — one `.txt` per main channel episode (filename = episode key).
  - `src/data/podcasts/` — one `.txt` per podcast episode.
- **Central config:** `src/lib/data-paths.ts` exports `DATA_DIRS.mainChannel` and `DATA_DIRS.podcasts` (absolute paths). All APIs and chat load from these only.

### 3.2 Transcript file format

- Plain text; any of these are supported and normalized before sending to the model:
  - **Timestamped lines:** `00:00`, `00:01:30`, or `[00:00:00]` at start of line (stripped).
  - **Speaker labels:** `SPEAKER_01:` at start of line (stripped).
  - **Plain paragraphs:** no prefix.
- **Recommendation:** one segment per line; empty lines collapsed. Normalization in `src/lib/content-utils.ts` (used by chat and list APIs).

### 3.3 Metadata (optional)

- **Files:** `src/data/main-channel/metadata.json`, `src/data/podcasts/metadata.json`.
- **Key:** exact filename without `.txt` (e.g. `"Asking Millionaires How To Make $1,000,000"`).
- **Fields (all optional):**
  - `youtube` — URL to video (used for “Watch on YouTube” and thumbnail).
  - `summary` — used for list preview when set.
  - `thumbnail` — path under `public/main-channel/` or full URL (main channel).
  - `guest` — display name for “Guest: Episode title” (main channel).
  - `date` — ISO string; used for sort order (newest first).
  - `category` — e.g. Sales, Funnel; shown as subtitle and searchable.
  - `title` — display title (overrides filename for list and chat header).

### 3.4 Thumbnails

- Main channel: `public/main-channel/{thumbnail}` or full URL in metadata.
- Fallback: YouTube icon (e.g. red play icon) when no thumbnail.

---

## 4. AI and chat behavior

### 4.1 Models

- Anthropic Claude via AI SDK: e.g. opus-4.5, sonnet-4.5, haiku-4.5 (mapped to model IDs in chat API).
- User can select model in UI; selection sent with each request.

### 4.2 Context retrieval (RAG)

- **At startup (API):** Load all `.txt` from `main-channel` and `podcasts`; build in-memory list with title, content, keywords (from title), optional youtube.
- **Per request:**
  - If user **selected an episode** (transcript title passed in request): force-include that transcript; run retrieval (chunked by lines, score by keyword match) and inject normalized excerpts under a heading like “## Episode: {title}”.
  - If **no selection:** from last N user messages, extract query text; keyword-match across transcripts; take top K transcripts (e.g. 5), retrieve chunks (e.g. top 24 chunks, cap total chars ~24k), inject under “## Relevant episode excerpts”.
- **Normalization:** Before sending to the model, strip timestamps and speaker labels from injected text so the model sees clean prose (same `content-utils` logic).

### 4.3 System prompt (tone)

- Persona: “School of Mentors AI — personal AI business advisor and strategic co-pilot.”
- Give implementation, not just information; execution-ready next steps; ROI-focused; grounded in mentor content.
- Tone: direct, concise, no filler (“Certainly”, “Great question”, etc.), no “Anything else?”; no emojis.
- When citing content: call it “podcast” or “episode”, never “transcript”; quote clean prose only (no timestamps/speaker IDs).
- Instruction that the model has access to “many episodes” and must use only provided context (no listing or guessing titles).

### 4.4 Streaming

- Responses stream from the API; UI shows streamed text (throttled for performance), then final message in history.

---

## 5. APIs (for clone)

### 5.1 `GET /api/main-channel`

- **Query:** `limit`, `offset` (pagination).
- **Response:** `{ items: [...], total }`.
- **Item:** `title`, `displayTitle`, `guest`, `category`, `preview`, `summary`, `youtube`, `image` (thumbnail URL or path).
- **Logic:** List `.txt` in `src/data/main-channel/`; sort by metadata `date` or file mtime (newest first); for null-placeholder filenames, optionally derive `displayTitle` from first phrase of content; read metadata for youtube, thumbnail, guest, category, title; preview from metadata summary or first ~480 chars of normalized content.

### 5.2 `GET /api/podcasts`

- Same pattern as main channel: pagination, sort newest first, metadata, preview.
- **Response:** `title`, `displayTitle`, `category`, `preview`, `summary`, `youtube`.

### 5.3 `POST /api/chat`

- **Body:** `messages`, `model`, `transcript` (optional; selected episode title).
- **Behavior:** Build system prompt + transcript context (see §4.2); call Anthropic; stream back.
- **Response:** streaming (e.g. AI SDK `toUIMessageStreamResponse()`).

---

## 6. Tech stack (clone target)

- **Framework:** Next.js 16 (App Router).
- **UI:** React 19, Tailwind CSS 4, Radix (dialog, etc.), optional shadcn components.
- **Fonts:** Plus Jakarta Sans, Archivo (brand), Geist Mono (from Next.js Google Fonts).
- **AI:** Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`); streaming with `streamText`, `convertToModelMessages`.
- **Auth (optional):** Supabase (`@supabase/ssr`, `@supabase/supabase-js`); `chats` table for history.
- **State:** React useState/useEffect; no global store required for MVP.

---

## 7. UI/UX details (clone)

### 7.1 Theming

- Dark theme by default (`className="dark"` on html).
- Colors: neutral grays for background and text; accent e.g. `#890B0F` / `#890B10` for links, YouTube icon, highlights.
- Sidebar: “School of Mentors” with brand font; nav items gray by default, light on hover/active.

### 7.2 Main channel list

- Rows: 40px thumb or YouTube icon, title (and optional category), chevron.
- Staggered entrance: first ~20 rows with 25ms delay steps; animation: fade-in + 8px translateY, 0.4s ease-out.
- Container: `scroll-smooth`, optional `custom-scrollbar`.

### 7.3 Copy and microcopy

- Subtitle under episode count: “Pick an episode for actionable advice. {N} episodes.”
- Chat input placeholder: e.g. “Ask your mentor anything...”.
- Source pill: “Watch on YouTube” with YouTube icon; hover card shows thumbnail + title.

### 7.4 Guest/title display

- Main channel: display “Guest: Episode title” when metadata `guest` is set (or parsed from title); otherwise `displayTitle` or filename. No em dash in UI; use colon.
- Podcasts: parse “Speaker on Topic” or “Topic | Speaker” from title for avatar and subtitle.

---

## 8. Out of scope (v1)

- No server-side transcript indexing (e.g. vector DB); keyword + chunk retrieval only.
- Call Recordings / Mentor Sessions are UI shells only until data source is defined.
- No public sharing of chats or episodes.
- No multi-workspace or team features.

---

## 9. File checklist (clone)

Ensure these exist and match the behavior above:

- **Config / data**
  - `src/lib/data-paths.ts`
  - `src/data/main-channel/` (`.txt` + optional `metadata.json`)
  - `src/data/podcasts/` (`.txt` + optional `metadata.json`)
  - `src/data/README.md` (content and metadata spec)
- **Content utils**
  - `src/lib/content-utils.ts` (normalize, extractPreview, extractGuestFromTitle, formatMainChannelTitle, sanitizeEpisodeTitle, extractTitleFromContent)
- **API routes**
  - `src/app/api/chat/route.ts`
  - `src/app/api/main-channel/route.ts`
  - `src/app/api/podcasts/route.ts`
- **App**
  - `src/app/layout.tsx` (metadata, fonts, dark)
  - `src/app/page.tsx` (sidebar, views, chat, main channel, podcasts, settings, recents)
  - `src/app/globals.css` (theme, keyframes e.g. main-channel-item-in, scrollbar)
- **Auth (optional)**
  - `src/hooks/use-auth.ts`, `src/lib/supabase.ts`, `src/lib/supabase-server.ts`
  - Login/signup/confirm/forgot-password pages and components
- **Chat**
  - `src/components/ui/claude-style-chat-input.tsx` (or equivalent)
- **Env**
  - `.env.local`: `ANTHROPIC_API_KEY`, optionally `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 10. Success criteria (clone complete when)

1. User can open app, see Home with greeting and input.
2. User can open Main channel and Podcasts, see paginated lists with correct titles and optional thumbnails/YouTube icon.
3. User can search and “Load more” in both lists.
4. User can click an episode and land in Chat with that episode as context; first assistant reply can show “Watch on YouTube” when URL exists.
5. User can send messages and get streamed, implementation-focused answers grounded in transcript context.
6. User can see Recents (from Supabase or localStorage), restore, rename, delete.
7. User can change model and use Settings view when auth is enabled.
