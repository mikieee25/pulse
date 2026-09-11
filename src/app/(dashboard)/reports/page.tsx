import { createClient } from "@/utils/supabase/server"
import { ReportsClient, type ReportEquipment } from "./reports-client"

export default async function ReportsPage() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()
  const [{ data, error }, { data: costs, error: costsError }] = await Promise.all([
    supabase.from("equipment").select(`
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
      equipment_categories(id,name)
    `).order("created_at", { ascending: false }),
    supabase.from("category_unit_costs").select("category_id,year,unit_cost").lte("year", currentYear).order("year", { ascending: false }),
  ])

  const queryError = error || costsError
  if (queryError) {
    console.error("Reports query failed", { code: queryError.code, message: queryError.message })
    return <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">Report data is unavailable. Try refreshing.</div>
  }

  const rateByCategory = new Map<string, number>()
  for (const cost of costs || []) if (!rateByCategory.has(cost.category_id)) rateByCategory.set(cost.category_id, cost.unit_cost)
  const equipment = ((data || []) as unknown as Array<ReportEquipment & { equipment_categories: { id: string; name: string } | null }>).map((item) => ({ ...item, rate: item.equipment_categories ? rateByCategory.get(item.equipment_categories.id) || 0 : 0 }))
  
  return <ReportsClient initialData={equipment} />
}
