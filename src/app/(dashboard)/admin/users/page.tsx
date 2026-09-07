import { createClient } from "@/utils/supabase/server"
import { UserManagement, type Division, type User } from "@/components/admin/user-management"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile()
  if (profile?.role !== "Admin") redirect("/")
  const supabase = await createClient()
  const [{ data: users }, { data: divisions }] = await Promise.all([supabase.from("app_users").select("id,email,full_name,role,division_scope").order("full_name"), supabase.from("divisions").select("id,code").order("code")])
  return <div className="space-y-6"><div><h1 className="text-3xl font-serif tracking-tight text-paper">Admin / Users</h1><p className="text-slate mt-1">Invite users and control role and division scope.</p></div><UserManagement users={(users || []) as unknown as User[]} divisions={(divisions || []) as unknown as Division[]} /></div>
}
