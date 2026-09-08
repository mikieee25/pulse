"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireProfile } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"

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

export type EquipmentInput = z.infer<typeof equipmentInput>

async function validateAssignment(input: EquipmentInput) {
  const supabase = await createClient()
  if (input.assigned_to) {
    const { data: person, error } = await supabase.from("personnel").select("plantilla_status,division_id,position").eq("id", input.assigned_to).single()
    if (error || !person) return "Selected Custodian was not found."
    if (person.plantilla_status !== "Regular" || ["PSS", "PES"].includes(person.position)) return "Custodian must be Regular personnel and NOT a PSS/PES user."
    if (person.division_id !== input.division_id) return "Custodian must be within the same division."
  }
  if (input.assignee_id) {
    const { data: person, error } = await supabase.from("personnel").select("plantilla_status,division_id,position").eq("id", input.assignee_id).single()
    if (error || !person) return "Selected Assignee was not found."
    if (!["PSS", "PES"].includes(person.position)) return "Assignee must be a PSS or PES user."
    if (person.division_id !== input.division_id) return "Assignee must be within the same division."
  }
  return null
}

async function categoryId(categoryName: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("equipment_categories").select("id").eq("name", categoryName).single()
  return data?.id || null
}

export async function addEquipment(input: EquipmentInput) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const parsed = equipmentInput.safeParse(input)
  if (!parsed.success) return { error: "Please complete the equipment fields." }
  const assignmentError = await validateAssignment(parsed.data)
  if (assignmentError) return { error: assignmentError }
  const category_id = await categoryId(parsed.data.categoryName)
  if (!category_id) return { error: "Category not found." }
  const supabase = await createClient()
  const { data: equipment, error } = await supabase.from("equipment").insert({
    category_id,
    brand: parsed.data.brand || null,
    model: parsed.data.model || null,
    year_acquired: parsed.data.year_acquired,
    serial_number: parsed.data.serial_number || null,
    procurement_method: parsed.data.procurement_method || null,
    division_id: parsed.data.division_id,
    assigned_to: parsed.data.assigned_to,
    assignee_id: parsed.data.assignee_id || null,
    condition_state: parsed.data.condition_state,
    status: "Active",
    remarks: parsed.data.remarks || null,
  }).select("id").single()
  if (error || !equipment) return { error: error?.message || "Could not add equipment." }
  if (parsed.data.assigned_to) await supabase.from("assignment_history").insert({ equipment_id: equipment.id, personnel_id: parsed.data.assigned_to, note: "Initial assignment", assignment_type: "Custodian" })
  if (parsed.data.assignee_id) await supabase.from("assignment_history").insert({ equipment_id: equipment.id, personnel_id: parsed.data.assignee_id, note: "Initial assignment", assignment_type: "Assignee" })
  revalidatePath("/equipment")
  return { success: true }
}

export async function updateEquipment(id: string, input: EquipmentInput) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const parsed = equipmentInput.safeParse(input)
  if (!parsed.success) return { error: "Please complete the equipment fields." }
  const assignmentError = await validateAssignment(parsed.data)
  if (assignmentError) return { error: assignmentError }
  const category_id = await categoryId(parsed.data.categoryName)
  if (!category_id) return { error: "Category not found." }
  const supabase = await createClient()
  
  // We keep the assignments untouched here because they are managed via reassignEquipment explicitly in the Detail page
  // However, if the dialog itself can change them, we should process them. Since the dialog currently resets assignments when division changes,
  // we'll update them if they differ. 
  const { data: existing } = await supabase.from("equipment").select("assigned_to, assignee_id").eq("id", id).single()
  
  const { error } = await supabase.from("equipment").update({
    category_id,
    brand: parsed.data.brand || null,
    model: parsed.data.model || null,
    year_acquired: parsed.data.year_acquired,
    serial_number: parsed.data.serial_number || null,
    procurement_method: parsed.data.procurement_method || null,
    division_id: parsed.data.division_id,
    condition_state: parsed.data.condition_state,
    remarks: parsed.data.remarks || null,
    // only update assignments if explicitly provided (the dialog will provide them)
    assigned_to: parsed.data.assigned_to,
    assignee_id: parsed.data.assignee_id || null,
  }).eq("id", id)
  if (error) return { error: error.message }

  if (existing?.assigned_to !== parsed.data.assigned_to) {
    const { error: historyError } = await supabase.rpc("reassign_equipment", { p_equipment_id: id, p_personnel_id: parsed.data.assigned_to, p_note: "Updated from equipment details", p_type: "Custodian" })
    if (historyError) return { error: historyError.message }
  }
  if (existing?.assignee_id !== (parsed.data.assignee_id || null)) {
    const { error: historyError } = await supabase.rpc("reassign_equipment", { p_equipment_id: id, p_personnel_id: parsed.data.assignee_id || null, p_note: "Updated from equipment details", p_type: "Assignee" })
    if (historyError) return { error: historyError.message }
  }

  revalidatePath("/equipment")
  revalidatePath(`/equipment/${id}`)
  return { success: true }
}

export async function reassignEquipment(id: string, personnelId: string | null, note = "", role: "Custodian" | "Assignee" = "Custodian") {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const supabase = await createClient()
  const { data: equipment } = await supabase.from("equipment").select("division_id").eq("id", id).single()
  if (!equipment) return { error: "Equipment not found." }
  
  const input: EquipmentInput = { categoryName: "Laptop", brand: null, model: null, year_acquired: null, serial_number: null, procurement_method: null, division_id: equipment.division_id, assigned_to: role === "Custodian" ? personnelId : null, assignee_id: role === "Assignee" ? personnelId : null, remarks: null, condition_state: "Good" }
  const assignmentError = await validateAssignment(input)
  if (assignmentError) return { error: assignmentError }
  
  const { error } = await supabase.rpc("reassign_equipment", { p_equipment_id: id, p_personnel_id: personnelId, p_note: note || null, p_type: role })
  if (error) return { error: error.message }
  revalidatePath("/equipment")
  revalidatePath(`/equipment/${id}`)
  return { success: true }
}

export async function retireEquipment(id: string) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const supabase = await createClient()
  const { error: historyError } = await supabase.rpc("reassign_equipment", { p_equipment_id: id, p_personnel_id: null, p_note: "Equipment retired", p_type: "Custodian" })
  await supabase.rpc("reassign_equipment", { p_equipment_id: id, p_personnel_id: null, p_note: "Equipment retired", p_type: "Assignee" })
  if (historyError) return { error: historyError.message }
  const { error } = await supabase.from("equipment").update({ status: "Retired", assigned_to: null, assignee_id: null }).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/equipment")
  revalidatePath(`/equipment/${id}`)
  return { success: true }
}

export async function updateEquipmentState(id: string, condition_state: string) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const supabase = await createClient()
  const { error } = await supabase.from("equipment").update({ condition_state }).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/equipment")
  revalidatePath(`/equipment/${id}`)
  return { success: true }
}

