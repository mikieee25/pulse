import Link from "next/link"
import { ArrowLeft, UsersRound } from "lucide-react"
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
        description="Invite users and control role and division scope."
        actions={<Link href="/admin" className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm font-semibold text-paper transition hover:border-pulse/40 hover:text-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40"><ArrowLeft className="size-4" aria-hidden="true" />Back to admin</Link>}
      />
      <UserManagement users={(users || []) as unknown as User[]} divisions={(divisions || []) as unknown as Division[]} />
    </div>
  )
}
