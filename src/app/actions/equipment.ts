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
  remarks: z.string().trim().nullable(),
})

export type EquipmentInput = z.infer<typeof equipmentInput>

async function validateAssignment(input: EquipmentInput) {
  if (!input.assigned_to) return null
  const supabase = await createClient()
  const { data: person, error } = await supabase.from("personnel").select("plantilla_status,division_id").eq("id", input.assigned_to).single()
  if (error || !person) return "Selected personnel was not found."
  if (person.plantilla_status !== "Regular") return "Equipment can only be assigned to Regular personnel."
  if (person.division_id !== input.division_id) return "Equipment can only be assigned within the same division."
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
    status: "Active",
    remarks: parsed.data.remarks || null,
  }).select("id").single()
  if (error || !equipment) return { error: error?.message || "Could not add equipment." }
  if (parsed.data.assigned_to) await supabase.from("assignment_history").insert({ equipment_id: equipment.id, personnel_id: parsed.data.assigned_to, note: "Initial assignment" })
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
  const { data: existing } = await supabase.from("equipment").select("assigned_to").eq("id", id).single()
  const { error } = await supabase.from("equipment").update({
    category_id,
    brand: parsed.data.brand || null,
    model: parsed.data.model || null,
    year_acquired: parsed.data.year_acquired,
    serial_number: parsed.data.serial_number || null,
    procurement_method: parsed.data.procurement_method || null,
    division_id: parsed.data.division_id,
    assigned_to: existing?.assigned_to || null,
    remarks: parsed.data.remarks || null,
  }).eq("id", id)
  if (error) return { error: error.message }
  if (existing?.assigned_to !== parsed.data.assigned_to) {
    const { error: historyError } = await supabase.rpc("reassign_equipment", { p_equipment_id: id, p_personnel_id: parsed.data.assigned_to, p_note: "Updated from equipment details" })
    if (historyError) return { error: historyError.message }
  }
  revalidatePath("/equipment")
  revalidatePath(`/equipment/${id}`)
  return { success: true }
}

export async function reassignEquipment(id: string, personnelId: string | null, note = "") {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const supabase = await createClient()
  const { data: equipment } = await supabase.from("equipment").select("division_id").eq("id", id).single()
  if (!equipment) return { error: "Equipment not found." }
  const input: EquipmentInput = { categoryName: "Laptop", brand: null, model: null, year_acquired: null, serial_number: null, procurement_method: null, division_id: equipment.division_id, assigned_to: personnelId, remarks: null }
  const assignmentError = await validateAssignment(input)
  if (assignmentError) return { error: assignmentError }
  const { error } = await supabase.rpc("reassign_equipment", { p_equipment_id: id, p_personnel_id: personnelId, p_note: note || null })
  if (error) return { error: error.message }
  revalidatePath("/equipment")
  revalidatePath(`/equipment/${id}`)
  return { success: true }
}

export async function retireEquipment(id: string) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const supabase = await createClient()
  const { error: historyError } = await supabase.rpc("reassign_equipment", { p_equipment_id: id, p_personnel_id: null, p_note: "Equipment retired" })
  if (historyError) return { error: historyError.message }
  const { error } = await supabase.from("equipment").update({ status: "Retired", assigned_to: null }).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/equipment")
  revalidatePath(`/equipment/${id}`)
  return { success: true }
}

export async function deleteEquipment(id: string) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const supabase = await createClient()
  const { error } = await supabase.from("equipment").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/equipment")
  return { success: true }
}
