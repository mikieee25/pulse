import { createClient } from "@/utils/supabase/server"
import { InventoryByDivisionChart, StatusBreakdownChart } from "@/components/dashboard/dashboard-charts"
import { lifecycleStatus } from "@/lib/pulse"

type EquipmentRow = { status: "Active" | "For Replacement" | "Retired"; year_acquired: number | null; division: { code: string } | null; equipment_categories: { name: string } | null }

export default async function Home() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("equipment").select("status,year_acquired,division:divisions(code),equipment_categories(name)")
  if (error) {
    console.error("Dashboard inventory query failed", { code: error.code, message: error.message, details: error.details, hint: error.hint })
    return <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert"><h1 className="text-xl font-medium">Inventory unavailable</h1><p className="mt-2 text-sm text-slate">Your PULSE profile may need to be registered or your session may need to be refreshed.</p></div>
  }
  const equipment = (data || []) as unknown as EquipmentRow[]
  const statuses = equipment.map((item) => lifecycleStatus(item.status, item.equipment_categories?.name, item.year_acquired))
  const divisionCounts: Record<string, number> = {}
  const replacementPlan: Record<string, number> = {}
  equipment.forEach((item, index) => {
    const division = item.division?.code || "Unknown"
    divisionCounts[division] = (divisionCounts[division] || 0) + 1
    if (statuses[index] === "For Replacement") replacementPlan[division] = (replacementPlan[division] || 0) + 1
  })
  const statusCounts = statuses.reduce<Record<string, number>>((counts, status) => ({ ...counts, [status]: (counts[status] || 0) + 1 }), {})
  const chartStatuses = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-serif tracking-tight text-paper">Dashboard</h1><p className="text-slate mt-1">Live overview of ICT equipment across all divisions.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{[
      ["Total equipment", equipment.length, "text-paper"], ["Active", statusCounts.Active || 0, "text-pulse"], ["For replacement", statusCounts["For Replacement"] || 0, "text-alert"], ["Expiring within 6 months", statusCounts["Expiring soon"] || 0, "text-amber-300"],
    ].map(([label, value, color]) => <div key={String(label)} className="bg-canvas-deep border border-line rounded-lg p-5"><p className="text-sm text-slate mb-2">{label}</p><p className={`text-3xl font-serif ${color}`}>{value}</p></div>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-canvas-deep border border-line rounded-lg p-5"><h2 className="text-lg font-medium text-paper mb-4">Inventory by Division</h2><InventoryByDivisionChart data={Object.entries(divisionCounts).map(([name, count]) => ({ name, count }))} /></div><div className="bg-canvas-deep border border-line rounded-lg p-5"><h2 className="text-lg font-medium text-paper mb-4">Status Breakdown</h2><StatusBreakdownChart data={chartStatuses} /></div></div>
    <div className="bg-canvas-deep border border-line rounded-lg p-5"><h2 className="text-lg font-medium text-paper mb-4">Replacement Plan for {new Date().getFullYear()}</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-line text-left text-slate"><th className="p-2">Division</th><th className="p-2">Units for replacement</th></tr></thead><tbody>{Object.entries(replacementPlan).sort().map(([division, count]) => <tr key={division} className="border-b border-line"><td className="p-2 text-paper">{division}</td><td className="p-2 text-alert">{count}</td></tr>)}{!Object.keys(replacementPlan).length && <tr><td colSpan={2} className="p-4 text-center text-slate">No replacement units.</td></tr>}</tbody></table></div></div>
  </div>
}
