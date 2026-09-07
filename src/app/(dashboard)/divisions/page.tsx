import { createClient } from "@/utils/supabase/server"
import { DivisionsTable } from "@/components/divisions/divisions-table"
import { columns, type DivisionData } from "@/components/divisions/columns"
import { AddDivisionDialog } from "@/components/divisions/add-division-dialog"

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
      equipment (count)
    `)
    .order('code')

  const divisions = (divisionsData || []).map((d: any) => ({
    id: d.id,
    code: d.code,
    full_name: d.full_name,
    _count: {
      personnel: d.personnel?.[0]?.count || 0,
      equipment: d.equipment?.[0]?.count || 0
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
          <button className="bg-pulse text-canvas-deep px-4 py-2 rounded-md font-semibold hover:bg-pulse/90 transition-colors">
            + Add Division
          </button>
        </AddDivisionDialog>
      </div>

      <DivisionsTable columns={columns} data={divisions} />
    </div>
  )
}
