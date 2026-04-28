import type { SupabaseClient, User } from "@supabase/supabase-js";

/** True once the user has completed or skipped the in-app tutorial. */
export function hasSeenTutorial(user: User | null): boolean {
  if (!user?.user_metadata) return false;
  return user.user_metadata.tutorial_seen === true;
}

/** Persist that the user has seen the tutorial so it never shows again. */
export async function markTutorialSeen(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { tutorial_seen: true },
  });
  if (error) throw error;
}
