import { createClient } from "@/utils/supabase/server"
import { PersonnelTable } from "@/components/personnel/personnel-table"
import { columns, type PersonnelData } from "@/components/personnel/columns"
import { AddPersonnelDialog } from "@/components/personnel/add-personnel-dialog"

export default async function PersonnelPage() {
  const supabase = await createClient()

  const { data: personnelData } = await supabase
    .from('personnel')
    .select(`
      id,
      full_name,
      position,
      plantilla_status,
      division:divisions(code, full_name)
    `)
    .order('full_name')

  const personnel = (personnelData || []) as unknown as PersonnelData[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-paper">Personnel</h1>
          <p className="text-slate mt-1">Manage ICT equipment custodians and staff.</p>
        </div>
        <AddPersonnelDialog>
          <button className="bg-pulse text-canvas-deep px-4 py-2 rounded-md font-semibold hover:bg-pulse/90 transition-colors">
            + Add Personnel
          </button>
        </AddPersonnelDialog>
      </div>

      <PersonnelTable columns={columns} data={personnel} />
    </div>
  )
}
