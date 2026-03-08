# Auth setup (Supabase)

**URL Configuration** (Authentication → URL Configuration):

- **Site URL:** your app root, e.g. `http://localhost:3000` or `https://your-domain.com`
- **Redirect URLs:** add these (and your production equivalents when you deploy):
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirm`

**Email sign-up:** Leave **Confirm email** on. The app sends `emailRedirectTo` to `/auth/confirm`. The confirm page runs in the browser and accepts tokens in the URL **hash** (Supabase default) or **query** (`token_hash` + `type`). Ensure **Redirect URLs** includes `https://your-domain.com/auth/confirm` (and `http://localhost:3000/auth/confirm` for local dev).

**Google:** Enable the Google provider and add Client ID/Secret from Google Cloud (OAuth client, redirect URI `.../auth/callback`). Same Redirect URLs list applies.

**Email rate limit:** If users see "Too many emails sent", Supabase is rate-limiting. You can adjust limits under Authentication → Rate Limits (or wait ~1 hour). The app shows a friendly message when the limit is hit.
