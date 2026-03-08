-- Run this in Supabase Dashboard → SQL Editor.
-- Secures public.chats so users can only access their own rows.

-- Ensure user_id column exists
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Drop the permissive anon policy if it exists
DROP POLICY IF EXISTS "Allow anon read and write chats" ON public.chats;

-- Authenticated users: select only their rows
CREATE POLICY "auth_select_own_chats"
  ON public.chats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users: insert with their user_id
CREATE POLICY "auth_insert_own_chats"
  ON public.chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users: update only their rows
CREATE POLICY "auth_update_own_chats"
  ON public.chats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users: delete only their rows
CREATE POLICY "auth_delete_own_chats"
  ON public.chats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for RLS performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);

-- If you have existing rows with NULL user_id, backfill or delete them before relying on RLS.
