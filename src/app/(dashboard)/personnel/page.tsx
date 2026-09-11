import { createClient } from "@/utils/supabase/server"
import { PersonnelTable } from "@/components/personnel/personnel-table"
import type { PersonnelData } from "@/components/personnel/columns"
import { AddPersonnelDialog } from "@/components/personnel/add-personnel-dialog"
import { Button } from "@/components/ui/button"
import { ContactRound, UserCheck, UsersRound } from "lucide-react"
import { MetricCard } from "@/components/layout/metric-card"
import { PageHeader } from "@/components/layout/page-header"
import { SectionPanel } from "@/components/layout/section-panel"
import { getCurrentProfile } from "@/lib/auth"

type PersonnelQueryRow = Record<string, unknown> & {
  equipment?: PersonnelData["equipment"]
  assignee_equipment?: PersonnelData["equipment"]
}

export default async function PersonnelPage() {
  const supabase = await createClient()
  const profile = await getCurrentProfile()
  const canManage = profile?.role === "Admin"

  const { data: personnelData, error } = await supabase
    .from('personnel')
    .select(`
      id,
      full_name,
      initials,
      position,
      plantilla_status,
      division_id,
       division:divisions(code, full_name),
       equipment!equipment_assigned_to_fkey(id, brand, model),
       assignee_equipment:equipment!equipment_assignee_id_fkey(id, brand, model)
    `)
    .order('full_name')
  
  if (error) console.error("Personnel query failed", error)

  const personnel = (personnelData || []).map((p: PersonnelQueryRow) => ({
     ...p,
     equipment: [...(p.equipment || []), ...(p.assignee_equipment || [])]
  })) as unknown as PersonnelData[]
  const { data: divisions, error: divisionsError } = await supabase.from('divisions').select('id,code,full_name').order('code')
  if (error || divisionsError) {
    const queryError = error || divisionsError;
    console.error("Personnel query failed", { code: queryError?.code, message: queryError?.message });
    return <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">Personnel data is unavailable. Try refreshing.</div>;
  }
  const regularCount = personnel.filter((person) => person.plantilla_status === "Regular").length
  const assignedCount = personnel.filter((person) => (person.equipment?.length || 0) > 0).length

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2"><UsersRound className="size-3.5" aria-hidden="true" />People & custodians</span>}
        title="Personnel"
        description="Manage staff and equipment custodians."
        actions={canManage ? <AddPersonnelDialog divisions={divisions || []}>
          <Button>
            + Add Personnel
          </Button>
        </AddPersonnelDialog> : undefined}
      />

      <section aria-labelledby="personnel-overview-title" className="grid gap-4 sm:grid-cols-3">
        <h2 id="personnel-overview-title" className="sr-only">Personnel overview</h2>
        <MetricCard label="Total personnel" value={personnel.length} detail="Registered staff" icon={UsersRound} />
        <MetricCard label="Regular staff" value={regularCount} detail="Eligible custodians" icon={UserCheck} tone="pulse" />
        <MetricCard label="With equipment" value={assignedCount} detail="Active custodians" icon={ContactRound} tone="warning" />
      </section>

      <SectionPanel title="Personnel directory" description="Search staff, divisions, positions, and assignment status">
        <div className="p-5"><PersonnelTable data={personnel} divisions={divisions || []} canManage={canManage} /></div>
      </SectionPanel>
    </div>
  )
}
