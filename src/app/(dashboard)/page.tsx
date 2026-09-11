import { createClient } from "@/utils/supabase/server"
import { InventoryByDivisionChart, StatusBreakdownChart } from "@/components/dashboard/dashboard-charts"
import { equipmentDisplayStatus, needsReplacement } from "@/lib/pulse"
import { Activity, Building2, CircleAlert, PackageCheck } from "lucide-react"
import { EmptyState } from "@/components/layout/empty-state"
import { MetricCard } from "@/components/layout/metric-card"
import { PageHeader } from "@/components/layout/page-header"
import { SectionPanel } from "@/components/layout/section-panel"

type EquipmentRow = { status: "Active" | "For Replacement" | "Retired"; condition_state: string; year_acquired: number | null; division: { code: string } | null; equipment_categories: { name: string } | null }
type EquipmentCategory = { name: string }

type ReplacementStats = { totalExpiring: number; totalBroken: number; categories: Record<string, { total: number; replacement: number }> }

export default async function Home() {
  const supabase = await createClient()
  const [{ data, error }, { data: categoryData, error: categoryError }] = await Promise.all([
    supabase.from("equipment").select("status,condition_state,year_acquired,division:divisions(code),equipment_categories(name)"),
    supabase.from("equipment_categories").select("name").order("name"),
  ])
  const queryError = error || categoryError
  if (queryError) {
    console.error("Dashboard inventory query failed", { code: queryError.code, message: queryError.message, details: queryError.details, hint: queryError.hint })
    return <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert"><h1 className="text-xl font-medium">Inventory unavailable</h1><p className="mt-2 text-sm text-slate">Your PULSE profile may need to be registered or your session may need to be refreshed.</p></div>
  }
  const equipment = (data || []) as unknown as EquipmentRow[]
  const categories = (categoryData || []) as EquipmentCategory[]
  const statuses = equipment.map((item) => equipmentDisplayStatus(item.status, item.condition_state, item.equipment_categories?.name, item.year_acquired))
  const divisionCounts: Record<string, number> = {}
  
  // New replacement plan tracking
  const plan: Record<string, ReplacementStats> = {}
  const allCategories = new Set(categories.map((category) => category.name))

  let totalBrokenAll = 0
  equipment.forEach((item, index) => {
    const division = item.division?.code || "Unknown"
    const cat = item.equipment_categories?.name || "Unknown"
    const isBroken = statuses[index] === "Broken"
    const isExpiring = !isBroken && statuses[index] === "For Replacement"
    const isReplacement = needsReplacement(item.status, item.condition_state, item.equipment_categories?.name, item.year_acquired)

    if (isBroken) totalBrokenAll++
    allCategories.add(cat)
    divisionCounts[division] = (divisionCounts[division] || 0) + 1
    
    if (!plan[division]) {
      plan[division] = { totalExpiring: 0, totalBroken: 0, categories: {} }
    }
    if (!plan[division].categories[cat]) {
      plan[division].categories[cat] = { total: 0, replacement: 0 }
    }
    
    plan[division].categories[cat].total++
    if (isReplacement) {
      plan[division].categories[cat].replacement++
      if (isBroken) plan[division].totalBroken++
      if (isExpiring) plan[division].totalExpiring++
    }
  })
  
  const statusCounts = statuses.reduce<Record<string, number>>((counts, status) => ({ ...counts, [status]: (counts[status] || 0) + 1 }), {})
  const chartStatuses = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  
  const catArray = Array.from(allCategories).sort()
  
  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2"><Activity className="size-3.5" aria-hidden="true" />Live inventory</span>}
        title="Dashboard"
        description="Live overview of ICT equipment across all divisions."
      />

      <section aria-labelledby="dashboard-overview-title" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <h2 id="dashboard-overview-title" className="sr-only">Dashboard overview</h2>
        <MetricCard label="Total equipment" value={equipment.length} detail="Tracked ICT assets" icon={PackageCheck} />
        <MetricCard label="Active" value={statusCounts.Active || 0} detail="Currently in service" icon={Activity} tone="pulse" />
        <MetricCard label="For replacement" value={(statusCounts["For Replacement"] || 0) + totalBrokenAll} detail={`${totalBrokenAll} broken units`} icon={CircleAlert} tone="alert" />
        <MetricCard label="Expiring in 1 year" value={statusCounts["Expiring soon"] || 0} detail="Lifecycle attention needed" icon={Building2} tone="warning" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionPanel title="Inventory by Division" description="Asset distribution across bureau offices">
          <div className="p-5"><InventoryByDivisionChart data={Object.entries(divisionCounts).map(([name, count]) => ({ name, count }))} /></div>
        </SectionPanel>
        <SectionPanel title="Status Breakdown" description="Current lifecycle status of tracked assets">
          <div className="p-5"><StatusBreakdownChart data={chartStatuses} /></div>
        </SectionPanel>
      </div>

      <SectionPanel title={`Replacement Plan for ${new Date().getFullYear()}`} description="Replacement and condition signals by division and category">
        {Object.keys(plan).length ? (
          <div className="max-h-[720px] overflow-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <caption className="sr-only">Replacement plan by division and equipment category</caption>
              <thead className="sticky top-0 z-10 border-b border-line bg-canvas text-slate">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Division</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Units expiring</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Units broken</th>
                  {catArray.map(cat => <th scope="col" key={cat} className="px-4 py-3 text-right font-medium">{cat} (Rep/Tot)</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.entries(plan).sort().map(([division, stats]) => (
                  <tr key={division} className="border-b border-line/50 transition hover:bg-paper/[0.025]">
                    <th scope="row" className="px-5 py-3 text-left font-semibold text-paper">{division}</th>
                    <td className={`px-4 py-3 text-right tabular-nums ${stats.totalExpiring > 0 ? "text-amber-300" : "text-slate"}`}>{stats.totalExpiring}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${stats.totalBroken > 0 ? "text-alert" : "text-slate"}`}>{stats.totalBroken}</td>
                    {catArray.map(cat => {
                      const catStats = stats.categories[cat] || { total: 0, replacement: 0 }
                      return <td key={cat} className={`px-4 py-3 text-right tabular-nums ${catStats.replacement > 0 ? "text-alert" : "text-slate"}`}>{catStats.replacement} / {catStats.total}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No replacement records yet" description="No equipment has been flagged for lifecycle attention." />
        )}
      </SectionPanel>
    </div>
  )
}
