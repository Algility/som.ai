# Production checklist

Use this list before deploying or when cleaning up the codebase.

## Environment

- [ ] Copy `.env.example` to `.env.local` and set all values.
- [ ] **Production:** Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY` in your hosting provider (Vercel, etc.).
- [ ] Supabase: Configure **Site URL** and **Redirect URLs** in Authentication → URL Configuration (see `AUTH_SETUP.md`).

## Security

- [ ] Never commit `.env` or `.env.local`. They are gitignored.
- [ ] Auth redirects: `next` query param is validated to relative paths only (no open redirect).
- [ ] API routes: Chat and correct-spelling require auth; request bodies are validated and size-limited.
- [ ] Security headers are set in `next.config.ts` (X-Content-Type-Options, Referrer-Policy, X-Frame-Options).

## Build & run

- [ ] `npm run build` succeeds.
- [ ] `npm run start` runs the production server; smoke-test login and one chat.
- [ ] Optional: run `npm run lint` and fix any issues.

## Optional hardening (as you grow)

- Rate limiting on `/api/chat` and `/api/correct-spelling`.
- Error monitoring (e.g. Sentry) and structured logging.
- Supabase RLS policies reviewed for `chats` and any other tables.
- CSP header if you need stricter script/style sources.

## Testing Sentry later

Sentry is configured via `src/instrumentation-client.ts` and server/edge configs. To verify: trigger a real error or call `Sentry.captureException(new Error("Test"))` and check Sentry → Issues.
