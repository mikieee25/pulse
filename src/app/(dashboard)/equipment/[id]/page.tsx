import { notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { AddEquipmentDialog } from "@/components/equipment/add-equipment-dialog"
import { EquipmentActions } from "@/components/equipment/equipment-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { lifecycleStatus } from "@/lib/pulse"

type DetailEquipment = { id: string; brand: string | null; model: string | null; serial_number: string | null; year_acquired: number | null; procurement_method: string | null; division_id: string; assigned_to: string | null; status: "Active" | "For Replacement" | "Retired"; remarks: string | null; division: { full_name: string; code: string } | null; personnel: { full_name: string; position: string; plantilla_status: string } | null; equipment_categories: { name: string } | null }
type HistoryEntry = { id: string; assigned_at: string; unassigned_at: string | null; note: string | null; personnel: { full_name: string } | null }

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("equipment").select("*,division:divisions(full_name,code),personnel(full_name,position,plantilla_status),equipment_categories(name)").eq("id", id).single()
  const equipment = data as unknown as DetailEquipment | null
  if (!equipment) notFound()
  const [{ data: personnel }, { data: historyData }] = await Promise.all([
    supabase.from("personnel").select("id,full_name,plantilla_status,division_id").eq("division_id", equipment.division_id).eq("plantilla_status", "Regular").order("full_name"),
    supabase.from("assignment_history").select("id,assigned_at,unassigned_at,note,personnel(full_name)").eq("equipment_id", id).order("assigned_at", { ascending: false }),
  ])
  const history = (historyData || []) as unknown as HistoryEntry[]
  const categoryName = equipment.equipment_categories?.name || "Laptop"
  const status = lifecycleStatus(equipment.status, categoryName, equipment.year_acquired)
  const division = equipment.division ? [{ id: equipment.division_id, code: equipment.division.code, full_name: equipment.division.full_name }] : []
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-3"><h1 className="text-3xl font-serif tracking-tight text-paper">{equipment.brand || "Unbranded"} {equipment.model || "Equipment"}</h1><Badge variant="outline" className="border-pulse text-pulse bg-pulse/10">{status}</Badge></div><p className="text-slate mt-1">Serial: {equipment.serial_number || "N/A"}</p></div><AddEquipmentDialog category={categoryName} divisions={division} personnel={personnel || []} initial={{ id: equipment.id, categoryName, brand: equipment.brand, model: equipment.model, year_acquired: equipment.year_acquired, serial_number: equipment.serial_number, procurement_method: equipment.procurement_method, division_id: equipment.division_id, assigned_to: equipment.assigned_to, remarks: equipment.remarks }}><Button>Edit details</Button></AddEquipmentDialog></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-canvas-deep border border-line rounded-lg p-6 space-y-4"><h2 className="text-lg font-serif text-paper">Hardware information</h2><dl className="grid grid-cols-2 gap-y-4"><div><dt className="text-sm text-slate">Category</dt><dd>{categoryName}</dd></div><div><dt className="text-sm text-slate">Year acquired</dt><dd>{equipment.year_acquired || "N/A"}</dd></div><div><dt className="text-sm text-slate">Procurement method</dt><dd>{equipment.procurement_method || "N/A"}</dd></div></dl></div><div className="bg-canvas-deep border border-line rounded-lg p-6 space-y-4"><h2 className="text-lg font-serif text-paper">Assignment details</h2><dl className="grid grid-cols-2 gap-y-4"><div><dt className="text-sm text-slate">Custodian</dt><dd>{equipment.personnel?.full_name || "Unassigned"}</dd></div><div><dt className="text-sm text-slate">Position</dt><dd>{equipment.personnel?.position || "-"}</dd></div><div><dt className="text-sm text-slate">Division</dt><dd>{equipment.division?.full_name || "-"}</dd></div></dl></div></div>
    <div className="bg-canvas-deep border border-line rounded-lg p-6 space-y-4"><h2 className="text-lg font-serif text-paper">Assignment actions</h2><EquipmentActions id={equipment.id} personnel={personnel || []} /></div>
    <div className="bg-canvas-deep border border-line rounded-lg p-6 space-y-4"><h2 className="text-lg font-serif text-paper">Assignment history</h2>{history.length ? <ol className="space-y-3">{history.map((entry) => <li key={entry.id} className="border-l-2 border-pulse pl-3"><p className="text-paper">{entry.personnel?.full_name || "Unknown personnel"}</p><p className="text-sm text-slate">Assigned {new Date(entry.assigned_at).toLocaleDateString()}{entry.unassigned_at ? ` · ended ${new Date(entry.unassigned_at).toLocaleDateString()}` : " · current"}</p>{entry.note && <p className="text-sm text-slate">{entry.note}</p>}</li>)}</ol> : <p className="text-slate">No assignment history.</p>}</div>
    {equipment.remarks && <div className="bg-canvas-deep border border-line rounded-lg p-6 space-y-2"><h2 className="text-lg font-serif text-paper">Remarks</h2><p className="text-slate">{equipment.remarks}</p></div>}
  </div>
}
