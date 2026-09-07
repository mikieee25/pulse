import { createClient } from "@/utils/supabase/server"
import { PersonnelTable } from "@/components/personnel/personnel-table"
import type { PersonnelData } from "@/components/personnel/columns"
import { AddPersonnelDialog } from "@/components/personnel/add-personnel-dialog"
import { Button } from "@/components/ui/button"

export default async function PersonnelPage() {
  const supabase = await createClient()

  const { data: personnelData } = await supabase
    .from('personnel')
    .select(`
      id,
      full_name,
      initials,
      position,
      plantilla_status,
      division_id,
       division:divisions(code, full_name),
       equipment(id, brand, model)
    `)
    .order('full_name')

  const personnel = (personnelData || []) as unknown as PersonnelData[]
  const { data: divisions } = await supabase.from('divisions').select('id,code,full_name').order('code')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-paper">Personnel</h1>
          <p className="text-slate mt-1">Manage staff and equipment custodians.</p>
        </div>
        <AddPersonnelDialog divisions={divisions || []}>
          <Button>
            + Add Personnel
          </Button>
        </AddPersonnelDialog>
      </div>

      <PersonnelTable data={personnel} divisions={divisions || []} />
    </div>
  )
}
