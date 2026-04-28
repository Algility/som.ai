import type { SupabaseClient } from "@supabase/supabase-js";

export function hasDisplayName(
  user: { user_metadata?: Record<string, unknown> } | null
): boolean {
  if (!user?.user_metadata) return false;
  const full = (user.user_metadata.full_name as string)?.trim();
  const name = (user.user_metadata.name as string)?.trim();
  return !!(full || name);
}

export async function saveDisplayName(
  supabase: SupabaseClient,
  firstName: string,
  lastName: string
): Promise<void> {
  const full_name = [firstName, lastName].filter(Boolean).join(" ");
  const { error } = await supabase.auth.updateUser({ data: { full_name } });
  if (error) throw error;
  await supabase.auth.refreshSession();
}

interface SaveGoalInput {
  firstName: string;
  lastName: string;
  goal: string;
}

export async function saveOnboardingGoal(
  supabase: SupabaseClient,
  { firstName, lastName, goal }: SaveGoalInput
): Promise<void> {
  const full_name = [firstName, lastName].filter(Boolean).join(" ");
  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: full_name || undefined,
      onboarding_goal: goal,
    },
  });
  if (error) throw error;
  await supabase.auth.refreshSession();
}
