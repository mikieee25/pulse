import { createClient } from "@/utils/supabase/server"
import { DivisionsTable } from "@/components/divisions/divisions-table"
import { columns, type DivisionData } from "@/components/divisions/columns"
import { AddDivisionDialog } from "@/components/divisions/add-division-dialog"
import { Button } from "@/components/ui/button"
import { lifecycleStatus } from "@/lib/pulse"

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-paper">Divisions</h1>
          <p className="text-slate mt-1">Manage bureau divisions and offices.</p>
        </div>
        <AddDivisionDialog>
          <Button>
            + Add Division
          </Button>
        </AddDivisionDialog>
      </div>

      <DivisionsTable columns={columns} data={divisions} />
    </div>
  )
}
