import "server-only"

import { createClient } from "@/utils/supabase/server"

export type AppRole = "Admin" | "Viewer"
export type AppProfile = { id: string; email: string; full_name: string; role: AppRole; division_scope: string | null }

export async function getCurrentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("app_users").select("id,email,full_name,role,division_scope").eq("id", user.id).maybeSingle()
  return profile as AppProfile | null
}

export async function requireProfile(role?: AppRole) {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Your account is not registered in PULSE." as const }
  if (role && profile.role !== role) return { error: "You do not have permission to perform this action." as const }
  return { profile }
}
