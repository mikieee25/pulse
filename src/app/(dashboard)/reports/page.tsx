import { createClient } from "@/utils/supabase/server"
import { ReportsClient, type ReportEquipment } from "./reports-client"
import { getCachedCategoryCosts } from "@/lib/cached-data"

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
      equipment_categories(id,name,lifespan_years)
    `).order("created_at", { ascending: false }),
    getCachedCategoryCosts(),
  ])

  const queryError = error || costsError
  if (queryError) {
    console.error("Reports query failed", { message: typeof queryError === "string" ? queryError : queryError.message })
    return <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">Report data is unavailable. Try refreshing.</div>
  }

  const rateByCategory = new Map<string, number>()
  for (const cost of costs || []) if (cost.year <= currentYear && !rateByCategory.has(cost.category_id)) rateByCategory.set(cost.category_id, cost.unit_cost)
  const equipment = ((data || []) as unknown as Array<ReportEquipment & { equipment_categories: { id: string; name: string; lifespan_years: number | null } | null }>).map((item) => ({ ...item, rate: item.equipment_categories ? rateByCategory.get(item.equipment_categories.id) || 0 : 0 }))
  
  return <ReportsClient initialData={equipment} />
}
