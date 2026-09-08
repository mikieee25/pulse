import { createClient } from "@/utils/supabase/server"
import { DivisionsTable } from "@/components/divisions/divisions-table"
import { columns, type DivisionData } from "@/components/divisions/columns"
import { AddDivisionDialog } from "@/components/divisions/add-division-dialog"
import { Button } from "@/components/ui/button"
import { lifecycleStatus } from "@/lib/pulse"
import { Building2, CircleAlert, UsersRound } from "lucide-react"
import { MetricCard } from "@/components/layout/metric-card"
import { PageHeader } from "@/components/layout/page-header"
import { SectionPanel } from "@/components/layout/section-panel"

export default async function DivisionsPage() {
  const supabase = await createClient()

  // In a real app with proper typegen, we might get this natively or via a view.
  // We fetch divisions and a raw count of personnel to show in the table.
  const { data: divisionsData } = await supabase
    .from('divisions')
    .select(`
      id,
      code,
      full_name,
       personnel (count),
       equipment (id, status, year_acquired, equipment_categories(name))
    `)
    .order('code')

  type DivisionRow = {
    id: string
    code: string
    full_name: string
    personnel?: Array<{ count: number }>
    equipment?: Array<{ status: 'Active' | 'For Replacement' | 'Retired'; year_acquired: number | null; equipment_categories?: { name: string } | null }>
  }
  const divisions = ((divisionsData || []) as unknown as DivisionRow[]).map((d) => ({
    id: d.id,
    code: d.code,
    full_name: d.full_name,
     _count: {
       personnel: d.personnel?.[0]?.count || 0,
       equipment: d.equipment?.length || 0,
       expired: d.equipment?.filter((item) => lifecycleStatus(item.status, item.equipment_categories?.name, item.year_acquired) === 'For Replacement').length || 0,
     }
  })) as DivisionData[]
  const totalPersonnel = divisions.reduce((total, division) => total + (division._count?.personnel || 0), 0)
  const totalEquipment = divisions.reduce((total, division) => total + (division._count?.equipment || 0), 0)
  const totalExpired = divisions.reduce((total, division) => total + (division._count?.expired || 0), 0)

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2"><Building2 className="size-3.5" aria-hidden="true" />Organization</span>}
        title="Divisions"
        description="Manage bureau divisions and offices."
        actions={<AddDivisionDialog>
          <Button>
            + Add Division
          </Button>
        </AddDivisionDialog>}
      />

      <section aria-labelledby="divisions-overview-title" className="grid gap-4 sm:grid-cols-3">
        <h2 id="divisions-overview-title" className="sr-only">Divisions overview</h2>
        <MetricCard label="Bureau divisions" value={divisions.length} detail="Registered offices" icon={Building2} />
        <MetricCard label="Personnel" value={totalPersonnel} detail={`${totalEquipment} tracked assets`} icon={UsersRound} tone="pulse" />
        <MetricCard label="Lifecycle attention" value={totalExpired} detail="Assets for replacement" icon={CircleAlert} tone="alert" />
      </section>

      <SectionPanel title="Division directory" description="Review personnel, equipment, and lifecycle counts by office">
        <div className="p-5"><DivisionsTable columns={columns} data={divisions} /></div>
      </SectionPanel>
    </div>
  )
}
