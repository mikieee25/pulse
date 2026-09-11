import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ClipboardList, History, MonitorSmartphone } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { AddEquipmentDialog } from "@/components/equipment/add-equipment-dialog"
import { EquipmentActions } from "@/components/equipment/equipment-actions"
import { EmptyState } from "@/components/layout/empty-state"
import { PageHeader } from "@/components/layout/page-header"
import { SectionPanel } from "@/components/layout/section-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { equipmentDisplayStatus } from "@/lib/pulse"
import type { EquipmentInput } from "@/app/actions/equipment"
import { getCurrentProfile } from "@/lib/auth"

type DetailEquipment = { id: string; brand: string | null; model: string | null; serial_number: string | null; year_acquired: number | null; procurement_method: string | null; division_id: string; assigned_to: string | null; assignee_id: string | null; condition_state: string; status: "Active" | "For Replacement" | "Retired"; remarks: string | null; division: { full_name: string; code: string } | null; personnel: { full_name: string; position: string; plantilla_status: string } | null; assignee: { full_name: string; position: string; plantilla_status: string } | null; equipment_categories: { name: string } | null }
type HistoryEntry = { id: string; assigned_at: string; unassigned_at: string | null; note: string | null; personnel: { full_name: string } | null; assignment_type: string }

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const profile = await getCurrentProfile()
  const canManage = profile?.role === "Admin"
  const { data, error: equipmentError } = await supabase.from("equipment").select("*,division:divisions(full_name,code),personnel!equipment_assigned_to_fkey(full_name,position,plantilla_status),assignee:personnel!equipment_assignee_id_fkey(full_name,position,plantilla_status),equipment_categories(name)").eq("id", id).single()
  if (equipmentError && equipmentError.code !== "PGRST116") {
    console.error("Equipment detail query failed", { code: equipmentError.code, message: equipmentError.message });
    return <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">Equipment details are unavailable. Try refreshing.</div>;
  }
  const equipment = data as unknown as DetailEquipment | null
  if (!equipment) notFound()

  const [{ data: personnel, error: personnelError }, { data: historyData, error: historyError }] = await Promise.all([
    supabase.from("personnel").select("id,full_name,position,plantilla_status,division_id").eq("division_id", equipment.division_id).order("full_name"),
    supabase.from("assignment_history").select("id,assigned_at,unassigned_at,note,assignment_type,personnel(full_name)").eq("equipment_id", id).order("assigned_at", { ascending: false }),
  ])
  if (personnelError || historyError) {
    const queryError = personnelError || historyError;
    console.error("Equipment detail support query failed", { code: queryError?.code, message: queryError?.message });
    return <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">Equipment assignment data is unavailable. Try refreshing.</div>;
  }
  const history = (historyData || []) as unknown as HistoryEntry[]
  const categoryName = equipment.equipment_categories?.name || "Laptop"
  const status = equipmentDisplayStatus(equipment.status, equipment.condition_state, categoryName, equipment.year_acquired)
  const division = equipment.division ? [{ id: equipment.division_id, code: equipment.division.code, full_name: equipment.division.full_name }] : []

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2"><MonitorSmartphone className="size-3.5" aria-hidden="true" />{categoryName} asset</span>}
        title={`${equipment.brand || "Unbranded"} ${equipment.model || "Equipment"}`}
        description={`Serial: ${equipment.serial_number || "N/A"}`}
        actions={<>
          <Link href="/equipment" className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm font-semibold text-paper transition hover:border-pulse/40 hover:text-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40">
            <ArrowLeft className="size-4" aria-hidden="true" />Back to equipment
          </Link>
          {canManage && <AddEquipmentDialog category={categoryName} divisions={division} personnel={personnel || []} initial={{ id: equipment.id, categoryName, brand: equipment.brand, model: equipment.model, year_acquired: equipment.year_acquired, serial_number: equipment.serial_number, procurement_method: equipment.procurement_method, division_id: equipment.division_id, assigned_to: equipment.assigned_to, assignee_id: equipment.assignee_id, condition_state: equipment.condition_state as EquipmentInput["condition_state"], remarks: equipment.remarks }}>
            <Button>Edit details</Button>
          </AddEquipmentDialog>}
        </>}
      >
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="border-pulse text-pulse bg-pulse/10">{status}</Badge>
          {equipment.condition_state && equipment.condition_state !== "Good" && <Badge variant="outline" className="border-alert text-alert bg-alert/10">{equipment.condition_state}</Badge>}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionPanel title="Hardware information" description="Core identity and procurement details">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 p-5">
            <div><dt className="text-xs text-slate">Category</dt><dd className="mt-1 text-sm text-paper">{categoryName}</dd></div>
            <div><dt className="text-xs text-slate">Year acquired</dt><dd className="mt-1 text-sm text-paper">{equipment.year_acquired || "N/A"}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-slate">Procurement method</dt><dd className="mt-1 text-sm text-paper">{equipment.procurement_method || "N/A"}</dd></div>
          </dl>
        </SectionPanel>

        <SectionPanel title="Assignment details" description="Current custodian, assignee, and division">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 p-5">
            <div><dt className="text-xs text-slate">Custodian</dt><dd className="mt-1 text-sm text-paper">{equipment.personnel?.full_name || "Unassigned"}</dd></div>
            <div><dt className="text-xs text-slate">Position</dt><dd className="mt-1 text-sm text-paper">{equipment.personnel?.position || "-"}</dd></div>
            <div><dt className="text-xs text-slate">Assignee</dt><dd className="mt-1 text-sm text-paper">{equipment.assignee?.full_name || "Unassigned"}</dd></div>
            <div><dt className="text-xs text-slate">Position</dt><dd className="mt-1 text-sm text-paper">{equipment.assignee?.position || "-"}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-slate">Division</dt><dd className="mt-1 text-sm text-paper">{equipment.division?.full_name || "-"}</dd></div>
          </dl>
        </SectionPanel>
      </div>

      {canManage && <SectionPanel title="Assignment actions" description="Update custodian, assignee, and equipment condition">
        <div className="p-5"><EquipmentActions id={equipment.id} personnel={personnel || []} currentState={equipment.condition_state as EquipmentInput["condition_state"]} currentCustodianId={equipment.assigned_to} currentAssigneeId={equipment.assignee_id} /></div>
      </SectionPanel>}

      <SectionPanel title="Assignment history" description="Recorded assignment events for this asset">
        {history.length ? (
          <ol className="space-y-4 p-5">
            {history.map((entry) => (
              <li key={entry.id} className="border-l-2 border-pulse pl-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-paper">{entry.personnel?.full_name || "Unknown personnel"}</p>
                  <Badge variant="outline" className="h-5 text-[10px]">{entry.assignment_type}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate">Assigned {new Date(entry.assigned_at).toLocaleDateString()}{entry.unassigned_at ? ` · ended ${new Date(entry.unassigned_at).toLocaleDateString()}` : " · current"}</p>
                {entry.note && <p className="mt-1 text-sm text-slate">{entry.note}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState icon={History} title="No assignment history" description="Assignment events will appear here when this asset is updated." />
        )}
      </SectionPanel>

      {equipment.remarks && (
        <SectionPanel title="Remarks" description="Additional notes recorded for this asset">
          <div className="flex gap-3 p-5 text-sm text-slate"><ClipboardList className="mt-0.5 size-4 shrink-0 text-pulse" aria-hidden="true" /><p>{equipment.remarks}</p></div>
        </SectionPanel>
      )}
    </div>
  )
}
