"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"
import { requireProfile } from "@/lib/auth"
import { canonicalEquipmentCategory } from "@/lib/pulse"
import { createClient } from "@/utils/supabase/server"
import { PULSE_CACHE_TAGS } from "@/lib/cache-tags"
import { recordActivity } from "@/lib/admin-activity"

const equipmentInput = z.object({
  categoryName: z.string().min(1),
  brand: z.string().trim().nullable(),
  model: z.string().trim().nullable(),
  year_acquired: z.number().int().min(1900).max(new Date().getFullYear()).nullable(),
  serial_number: z.string().trim().nullable(),
  procurement_method: z.string().trim().nullable(),
  division_id: z.string().uuid(),
  assigned_to: z.string().uuid().nullable(),
  assignee_id: z.string().uuid().nullable().optional(),
  condition_state: z.enum(["Good", "For Replacement", "Broken"]).default("Good"),
  remarks: z.string().trim().nullable(),
})
const equipmentId = z.uuid()
const conditionState = z.enum(["Good", "For Replacement", "Broken"])

export type EquipmentInput = z.infer<typeof equipmentInput>
type Supabase = Awaited<ReturnType<typeof createClient>>

function equipmentLabel(input: Pick<EquipmentInput, "brand" | "model" | "serial_number">) {
  return [input.brand, input.model, input.serial_number].filter(Boolean).join(" ") || "Equipment"
}

async function validateAssignment(supabase: Supabase, divisionId: string, personnelId: string | null, role: "Custodian" | "Assignee") {
  if (!personnelId) return null
  const { data: person, error } = await supabase.from("personnel").select("plantilla_status,division_id,position").eq("id", personnelId).single()
  if (error || !person) return `Selected ${role} was not found.`
  if (person.division_id !== divisionId) return `${role} must be within the same division.`
  if (role === "Custodian" && (person.plantilla_status !== "Regular" || ["PSS", "PES"].includes(person.position))) return "Custodian must be Regular personnel and NOT a PSS/PES user."
  if (role === "Assignee" && !["PSS", "PES"].includes(person.position)) return "Assignee must be a PSS or PES user."
  return null
}

async function findCategoryId(supabase: Supabase, categoryName: string) {
  const { data, error } = await supabase.from("equipment_categories").select("id").eq("name", canonicalEquipmentCategory(categoryName)).maybeSingle()
  if (error) return { id: null, error: "Could not load equipment categories." }
  return { id: data?.id ?? null, error: null }
}

export async function addEquipment(input: EquipmentInput) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const parsed = equipmentInput.safeParse(input)
  if (!parsed.success) return { error: "Please complete the equipment fields." }
  const supabase = await createClient()
  const custodianError = await validateAssignment(supabase, parsed.data.division_id, parsed.data.assigned_to, "Custodian")
  if (custodianError) return { error: custodianError }
  const assigneeError = await validateAssignment(supabase, parsed.data.division_id, parsed.data.assignee_id || null, "Assignee")
  if (assigneeError) return { error: assigneeError }
  const category = await findCategoryId(supabase, parsed.data.categoryName)
  if (category.error) return { error: category.error }
  if (!category.id) return { error: "Category not found." }
  const { data: equipmentId, error } = await supabase.rpc("save_equipment", {
    p_equipment_id: null,
    p_category_id: category.id,
    p_brand: parsed.data.brand || null,
    p_model: parsed.data.model || null,
    p_year_acquired: parsed.data.year_acquired,
    p_serial_number: parsed.data.serial_number || null,
    p_procurement_method: parsed.data.procurement_method || null,
    p_division_id: parsed.data.division_id,
    p_assigned_to: parsed.data.assigned_to,
    p_assignee_id: parsed.data.assignee_id || null,
    p_condition_state: parsed.data.condition_state,
    p_remarks: parsed.data.remarks || null,
  })
  if (error || !equipmentId) return { error: error?.message || "Could not add equipment." }
  await recordActivity({ action: "created", entityType: "equipment", entityId: equipmentId, entityLabel: equipmentLabel(parsed.data), divisionId: parsed.data.division_id })
  revalidateTag(PULSE_CACHE_TAGS.notifications, "max")
  revalidatePath("/equipment")
  return { success: true }
}

export async function updateEquipment(id: string, input: EquipmentInput) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  if (!equipmentId.safeParse(id).success) return { error: "Equipment not found." }
  const parsed = equipmentInput.safeParse(input)
  if (!parsed.success) return { error: "Please complete the equipment fields." }
  const supabase = await createClient()
  const custodianError = await validateAssignment(supabase, parsed.data.division_id, parsed.data.assigned_to, "Custodian")
  if (custodianError) return { error: custodianError }
  const assigneeError = await validateAssignment(supabase, parsed.data.division_id, parsed.data.assignee_id || null, "Assignee")
  if (assigneeError) return { error: assigneeError }
  const category = await findCategoryId(supabase, parsed.data.categoryName)
  if (category.error) return { error: category.error }
  if (!category.id) return { error: "Category not found." }
  const { error } = await supabase.rpc("save_equipment", {
    p_equipment_id: id,
    p_category_id: category.id,
    p_brand: parsed.data.brand || null,
    p_model: parsed.data.model || null,
    p_year_acquired: parsed.data.year_acquired,
    p_serial_number: parsed.data.serial_number || null,
    p_procurement_method: parsed.data.procurement_method || null,
    p_division_id: parsed.data.division_id,
    p_assigned_to: parsed.data.assigned_to,
    p_assignee_id: parsed.data.assignee_id || null,
    p_condition_state: parsed.data.condition_state,
    p_remarks: parsed.data.remarks || null,
  })
  if (error) return { error: error.message }

  await recordActivity({ action: "updated", entityType: "equipment", entityId: id, entityLabel: equipmentLabel(parsed.data), divisionId: parsed.data.division_id })

  revalidateTag(PULSE_CACHE_TAGS.notifications, "max")
  revalidatePath("/equipment")
  revalidatePath(`/equipment/${id}`)
  return { success: true }
}

export async function reassignEquipment(id: string, personnelId: string | null, note = "", role: "Custodian" | "Assignee" = "Custodian") {
  const access = await requireProfile("Admin")
  if (access.error) return access
  if (!equipmentId.safeParse(id).success || (personnelId !== null && !equipmentId.safeParse(personnelId).success)) return { error: "Invalid equipment assignment." }
  const supabase = await createClient()
  const { data: equipment } = await supabase.from("equipment").select("division_id,brand,model,serial_number").eq("id", id).single()
  if (!equipment) return { error: "Equipment not found." }
  
  const assignmentError = await validateAssignment(supabase, equipment.division_id, personnelId, role)
  if (assignmentError) return { error: assignmentError }
  
  const { error } = await supabase.rpc("reassign_equipment", { p_equipment_id: id, p_personnel_id: personnelId, p_note: note || null, p_type: role })
  if (error) return { error: error.message }
  await recordActivity({ action: personnelId ? "reassigned" : "assigned", entityType: "equipment", entityId: id, entityLabel: equipmentLabel(equipment), divisionId: equipment.division_id, metadata: { role, personnelId } })
  revalidateTag(PULSE_CACHE_TAGS.notifications, "max")
  revalidatePath("/equipment")
  revalidatePath(`/equipment/${id}`)
  return { success: true }
}

export async function retireEquipment(id: string) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  if (!equipmentId.safeParse(id).success) return { error: "Equipment not found." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("retire_equipment", { p_equipment_id: id })
  if (error) return { error: error.message }
  await recordActivity({ action: "retired", entityType: "equipment", entityId: id, entityLabel: "Equipment", metadata: {} })
  revalidateTag(PULSE_CACHE_TAGS.notifications, "max")
  revalidatePath("/equipment")
  revalidatePath(`/equipment/${id}`)
  return { success: true }
}

export async function updateEquipmentState(id: string, condition_state: string) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  if (!equipmentId.safeParse(id).success) return { error: "Equipment not found." }
  const parsedState = conditionState.safeParse(condition_state)
  if (!parsedState.success) return { error: "Invalid equipment state." }
  const supabase = await createClient()
  const { data, error } = await supabase.from("equipment").update({ condition_state: parsedState.data }).eq("id", id).select("id").maybeSingle()
  if (error) return { error: error.message }
  if (!data) return { error: "Equipment not found." }
  await recordActivity({ action: "state_changed", entityType: "equipment", entityId: id, entityLabel: "Equipment", metadata: { condition_state: parsedState.data } })
  revalidateTag(PULSE_CACHE_TAGS.notifications, "max")
  revalidatePath("/equipment")
  revalidatePath(`/equipment/${id}`)
  return { success: true }
}
