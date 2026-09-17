"use server";

import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

export async function touchPresence(): Promise<
  { success: true } | { error: string }
> {
  const access = await requireProfile();
  if (access.error) return access;
  const admin = createAdminClient();
  if (!admin) return { error: "Presence tracking is unavailable." };
  const now = new Date().toISOString();
  const { error } = await admin
    .from("user_presence")
    .upsert({ user_id: access.profile.id, last_seen_at: now, updated_at: now });
  return error
    ? { error: "Presence tracking is unavailable." }
    : { success: true };
}
