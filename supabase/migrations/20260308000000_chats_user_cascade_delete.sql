-- Allow deleting users from Supabase Dashboard: when a user is deleted,
-- their chat rows are removed automatically (no "Database error deleting user").
-- Run this migration on your project (e.g. supabase db push or run in SQL Editor), then try deleting users again.

-- Drop only the FK from public.chats.user_id -> auth.users (so we can re-add with CASCADE)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_class ref ON ref.oid = c.confrelid
    JOIN pg_namespace refn ON refn.oid = ref.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'chats' AND c.contype = 'f'
      AND refn.nspname = 'auth' AND ref.relname = 'users'
  ) LOOP
    EXECUTE format('ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- Re-add FK with ON DELETE CASCADE so deleting a user deletes their chats
ALTER TABLE public.chats
  ADD CONSTRAINT chats_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users (id)
  ON DELETE CASCADE;
