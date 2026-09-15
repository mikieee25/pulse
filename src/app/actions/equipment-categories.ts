"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireProfile } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { canonicalEquipmentCategory } from "@/lib/pulse"

const categoryInput = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(50, "Category name is too long."),
})

export type EquipmentCategoryInput = z.infer<typeof categoryInput>

export async function addEquipmentCategory(input: EquipmentCategoryInput) {
  const access = await requireProfile("Admin")
  if (access.error) return access

  const parsed = categoryInput.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Enter a valid category name." }

  const supabase = await createClient()
  const name = canonicalEquipmentCategory(parsed.data.name)
  const { error } = await supabase.from("equipment_categories").insert({ name, lifespan_years: 3 })
  if (error) {
    if (error.code === "23505") return { error: "That equipment category already exists." }
    return { error: error.message }
  }

  revalidatePath("/equipment")
  revalidatePath("/budget")
  revalidatePath("/summary")
  revalidatePath("/reports")
  revalidatePath("/")
  return { success: true }
}
