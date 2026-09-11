import { UsersRound } from "lucide-react"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { UserManagement, type Division, type User } from "@/components/admin/user-management"
import { PageHeader } from "@/components/layout/page-header"
import { getCurrentProfile } from "@/lib/auth"

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile()
  if (profile?.role !== "Admin") redirect("/")
  const supabase = await createClient()
  const [{ data: users }, { data: divisions }] = await Promise.all([
    supabase.from("app_users").select("id,email,full_name,role,division_scope").order("full_name"),
    supabase.from("divisions").select("id,code").order("code"),
  ])

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2"><UsersRound className="size-3.5" aria-hidden="true" />Administration</span>}
        title="Admin / Users"
        description="Create users and control role and division scope."
      />
      <UserManagement users={(users || []) as unknown as User[]} divisions={(divisions || []) as unknown as Division[]} />
    </div>
  )
}
