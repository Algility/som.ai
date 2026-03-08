# Auth setup (Supabase)

**URL Configuration** (Authentication → URL Configuration):

- **Site URL:** your app root, e.g. `http://localhost:3000` or `https://your-domain.com`
- **Redirect URLs:** add these (and your production equivalents when you deploy):
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirm`

**Email sign-up:** Leave **Confirm email** on. The app sends `emailRedirectTo` to `/auth/confirm`. The confirm page runs in the browser and accepts tokens in the URL **hash** (Supabase default) or **query** (`token_hash` + `type`). Ensure **Redirect URLs** includes `https://your-domain.com/auth/confirm` (and `http://localhost:3000/auth/confirm` for local dev).

**Google:** Enable the Google provider and add Client ID/Secret from Google Cloud (OAuth client, redirect URI `.../auth/callback`). Same Redirect URLs list applies.

**Email rate limit:** If users see "Too many emails sent", Supabase is rate-limiting. You can adjust limits under Authentication → Rate Limits (or wait ~1 hour). The app shows a friendly message when the limit is hit.

**Leaked password protection (Security Advisor):** To fix “Leaked Password Protection Disabled”, enable it in the Dashboard so Supabase checks new and changed passwords against HaveIBeenPwned. **Requires Pro plan.**

1. In Supabase Dashboard go to **Authentication** → **Providers** → **Email** (or **Authentication** → **Policies** / **Settings** depending on your dashboard).
2. Find **Password protection** or **Leaked password protection** and turn it **On**.

If the option is under a different menu, check **Project Settings** → **Auth** for security or password options and enable “Prevent use of leaked passwords” (or similar wording).

**Deleting users ("Database error deleting user"):** The app stores chats in `public.chats` with a foreign key to `auth.users`, so the dashboard can't delete a user until that FK allows it. Apply the migration `supabase/migrations/20260308000000_chats_user_cascade_delete.sql` (run in SQL Editor or `supabase db push`). It sets the FK to `ON DELETE CASCADE` so deleting a user also deletes their chats; then user deletion in the dashboard works.

**Profile photo (Settings) / "Bucket not found":** The profile photo upload uses an `avatars` storage bucket. If you see **Bucket not found**:

1. **Option A (recommended):** In Supabase Dashboard go to **SQL Editor** → **New query**, paste the contents of `supabase/migrations/20260308120000_storage_avatars_bucket.sql`, and click **Run**. That creates the `avatars` bucket and the policies in one go.

2. **Option B:** Create the bucket in the UI: **Storage** → **New bucket** → Name: `avatars`, enable **Public bucket** → **Create**. Then in **SQL Editor** run only the four `create policy` statements from that migration (the part starting with `create policy "Users can upload their own avatar"`).

After the bucket and policies exist, try changing your profile photo again.
