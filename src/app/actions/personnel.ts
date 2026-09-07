"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireProfile } from "@/lib/auth"
import { PLANTILLA_STATUSES, suggestedInitials } from "@/lib/pulse"
import { createClient } from "@/utils/supabase/server"

const personnelInput = z.object({
  full_name: z.string().trim().min(1),
  initials: z.string().trim().min(1).max(12),
  position: z.string().trim().min(1),
  plantilla_status: z.enum(PLANTILLA_STATUSES),
  division_id: z.string().uuid(),
})
export type PersonnelInput = z.infer<typeof personnelInput>

export async function addPersonnel(input: PersonnelInput) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const parsed = personnelInput.safeParse({ ...input, initials: input.initials || suggestedInitials(input.full_name) })
  if (!parsed.success) return { error: "Please complete the personnel fields." }
  const supabase = await createClient()
  const { error } = await supabase.from("personnel").insert(parsed.data)
  if (error) return { error: error.message }
  revalidatePath("/personnel")
  return { success: true }
}

export async function updatePersonnel(id: string, input: PersonnelInput) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const parsed = personnelInput.safeParse(input)
  if (!parsed.success) return { error: "Please complete the personnel fields." }
  const supabase = await createClient()
  const { error } = await supabase.from("personnel").update(parsed.data).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/personnel")
  return { success: true }
}

export async function deletePersonnel(id: string) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const supabase = await createClient()
  const { count, error: equipmentError } = await supabase
    .from("equipment")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", id)
  if (equipmentError) return { error: equipmentError.message }
  if (count) return { error: "Unassign this person's equipment before deleting the personnel record." }
  const { error } = await supabase.from("personnel").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/personnel")
  return { success: true }
}
