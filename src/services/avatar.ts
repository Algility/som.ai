import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "avatars";
export const MISSING_AVATAR_BUCKET_MESSAGE =
  'Avatars bucket missing. In Supabase Dashboard run Storage → New bucket → name "avatars", set Public, then add policies (see AUTH_SETUP.md).';

export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<void> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });
  if (updateError) throw updateError;
}

export async function removeAvatar(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: files } = await supabase.storage.from(BUCKET).list(userId);
  if (files?.length) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }
  await supabase.auth.updateUser({ data: { avatar_url: "" } });
}

export function isBucketMissingError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /bucket.*not found|Bucket not found/i.test(msg);
}
