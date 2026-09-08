import { createClient } from "@/utils/supabase/server"
import { ReportsClient, type ReportEquipment } from "./reports-client"

export default async function ReportsPage() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("equipment")
    .select(`
      id,
      brand,
      model,
      year_acquired,
      serial_number,
      procurement_method,
      status,
      condition_state,
      division:divisions(code),
      personnel!equipment_assigned_to_fkey(full_name),
      assignee:personnel!equipment_assignee_id_fkey(full_name),
      equipment_categories(name)
    `)
    .order("created_at", { ascending: false })
    
  if (error) {
    console.error("Reports query failed:", error)
  }
  
  const equipment = (data || []) as unknown as ReportEquipment[]
  
  return <ReportsClient initialData={equipment} />
}
