import Link from "next/link"
import { ArrowRight, ShieldCheck } from "lucide-react"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { SectionPanel } from "@/components/layout/section-panel"
import { getCurrentProfile } from "@/lib/auth"
import { getRecentAdminActivity } from "@/lib/admin-activity"
import { ActivityPreview } from "@/components/admin/admin-activity"

export default async function AdminPage() {
  const profile = await getCurrentProfile()
  if (profile?.role !== "Admin") redirect("/")
  const activity = await getRecentAdminActivity(5)

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2"><ShieldCheck className="size-3.5" aria-hidden="true" />Administration</span>}
        title="Admin"
        description="Manage access and system reference values."
      />
      <SectionPanel title="Access management" description="Control PULSE users, roles, and division scope.">
        <div className="p-5">
          <Link href="/admin/users" className="inline-flex items-center gap-2 rounded-xl border border-pulse/30 bg-pulse/10 px-4 py-3 text-sm font-semibold text-pulse transition hover:bg-pulse/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40">
            Manage users
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </SectionPanel>
      <ActivityPreview data={activity.data} error={activity.error} />
    </div>
  )
}
