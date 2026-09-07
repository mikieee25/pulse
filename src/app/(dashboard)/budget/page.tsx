import { createClient } from "@/utils/supabase/server"
import { saveCategoryCost } from "@/app/actions/admin"
import { lifecycleStatus } from "@/lib/pulse"
import { ExportButton } from "@/components/equipment/export-button"

type Equipment = { status: "Active" | "For Replacement" | "Retired"; year_acquired: number | null; division: { code: string } | null; equipment_categories: { id: string; name: string; lifespan_years: number | null } | null }
type Cost = { category_id: string; year: number; unit_cost: number }

export default async function BudgetPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const year = Number((await searchParams).year) || new Date().getFullYear()
  const supabase = await createClient()
  const [{ data: equipmentData }, { data: categories }, { data: costs }, { data: divisions }] = await Promise.all([
    supabase.from("equipment").select("status,year_acquired,division:divisions(code),equipment_categories(id,name,lifespan_years)"),
    supabase.from("equipment_categories").select("id,name").order("name"),
    supabase.from("category_unit_costs").select("category_id,year,unit_cost").eq("year", year),
    supabase.from("divisions").select("code").order("code"),
  ])
  const equipment = (equipmentData || []) as unknown as Equipment[]
  const costRows = (costs || []) as unknown as Cost[]
  const costByCategory = new Map(costRows.map((cost) => [cost.category_id, cost.unit_cost]))
  const count = (division: string, category: string) => equipment.filter((item) => item.division?.code === division && item.equipment_categories?.name === category && lifecycleStatus(item.status, item.equipment_categories?.name, item.year_acquired) === "For Replacement").length
  const rows = (divisions || []).flatMap((division) => (categories || []).map((category) => ({ division: division.code, category: category.name, categoryId: category.id, units: count(division.code, category.name), unitCost: costByCategory.get(category.id) || 0 })))
  const total = rows.reduce((sum, row) => sum + row.units * row.unitCost, 0)
  const exportRows = rows.map((row) => ({ Division: row.division, Category: row.category, Units: row.units, "Unit Cost": row.unitCost, Subtotal: row.units * row.unitCost }))
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-serif tracking-tight text-paper">Budget / replacement planning</h1><p className="text-slate mt-1">Live replacement units multiplied by the selected year’s unit costs.</p></div><div className="flex items-end gap-2"><ExportButton data={exportRows} category={`budget-${year}`} /><form className="flex items-end gap-2"><label className="text-sm text-slate">Year<input name="year" type="number" defaultValue={year} className="ml-2 h-9 w-24 rounded-md border border-line bg-canvas-deep px-2 text-paper" /></label><button className="h-9 rounded-md bg-pulse px-3 text-sm font-medium text-canvas">View</button></form></div></div><div className="bg-canvas-deep border border-line rounded-lg p-5 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-line text-left text-slate"><th className="p-2">Division</th><th className="p-2">Category</th><th className="p-2">Units</th><th className="p-2">Unit cost</th><th className="p-2">Subtotal</th><th className="p-2">Admin update</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.division}-${row.category}`} className="border-b border-line"><td className="p-2 text-paper">{row.division}</td><td className="p-2 text-paper">{row.category}</td><td className="p-2">{row.units}</td><td className="p-2">₱ {row.unitCost.toLocaleString()}</td><td className="p-2 text-pulse">₱ {(row.units * row.unitCost).toLocaleString()}</td><td className="p-2"><form action={saveCategoryCost} className="flex gap-1"><input type="hidden" name="category_id" value={row.categoryId} /><input type="hidden" name="year" value={year} /><input name="unit_cost" type="number" min="0" defaultValue={row.unitCost || ""} placeholder="cost" className="h-8 w-24 rounded border border-line bg-canvas px-2" /><button className="h-8 rounded bg-canvas px-2 text-xs text-pulse">Save</button></form></td></tr>)}</tbody><tfoot><tr><td colSpan={4} className="p-3 text-right font-medium text-paper">Grand total</td><td className="p-3 font-semibold text-pulse">₱ {total.toLocaleString()}</td><td /></tr></tfoot></table></div></div>
}
