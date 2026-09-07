"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireProfile } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"

const divisionInput = z.object({ code: z.string().trim().min(2).max(16), full_name: z.string().trim().min(1) })
export type DivisionInput = z.infer<typeof divisionInput>

export async function addDivision(input: DivisionInput) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const parsed = divisionInput.safeParse(input)
  if (!parsed.success) return { error: "Please complete the division fields." }
  const supabase = await createClient()
  const { error } = await supabase.from("divisions").insert({ code: parsed.data.code.toUpperCase(), full_name: parsed.data.full_name })
  if (error) return { error: error.message }
  revalidatePath("/divisions")
  return { success: true }
}

export async function updateDivision(id: string, input: DivisionInput) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const parsed = divisionInput.safeParse(input)
  if (!parsed.success) return { error: "Please complete the division fields." }
  const supabase = await createClient()
  const { error } = await supabase.from("divisions").update({ code: parsed.data.code.toUpperCase(), full_name: parsed.data.full_name }).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/divisions")
  return { success: true }
}
