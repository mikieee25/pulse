"use server"

import { revalidatePath } from "next/cache"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"
import { requireProfile } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"

const userInput = z.object({ email: z.email(), full_name: z.string().trim().min(1), role: z.enum(["Admin", "Viewer"]), division_scope: z.string().uuid().nullable() })

export async function inviteUser(input: z.infer<typeof userInput>) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const parsed = userInput.safeParse(input)
  if (!parsed.success || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { error: "Admin invite configuration is incomplete." }
  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email)
  if (error || !data.user) return { error: error?.message || "Could not invite user." }
  const supabase = await createClient()
  const { error: profileError } = await supabase.from("app_users").insert({ id: data.user.id, email: parsed.data.email, full_name: parsed.data.full_name, role: parsed.data.role, division_scope: parsed.data.division_scope })
  if (profileError) return { error: profileError.message }
  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateUser(id: string, input: Pick<z.infer<typeof userInput>, "role" | "division_scope">) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const parsed = z.object({ role: z.enum(["Admin", "Viewer"]), division_scope: z.string().uuid().nullable() }).safeParse(input)
  if (!parsed.success) return { error: "Invalid user settings." }
  const supabase = await createClient()
  const { error } = await supabase.from("app_users").update(parsed.data).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateCategoryCost(formData: FormData) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const categoryId = z.string().uuid().safeParse(formData.get("category_id"))
  const year = z.coerce.number().int().min(2000).max(2100).safeParse(formData.get("year"))
  const unitCost = z.coerce.number().nonnegative().safeParse(formData.get("unit_cost"))
  if (!categoryId.success || !year.success || !unitCost.success) return { error: "Invalid cost values." }
  const supabase = await createClient()
  const { error } = await supabase.from("category_unit_costs").upsert({ category_id: categoryId.data, year: year.data, unit_cost: unitCost.data }, { onConflict: "category_id,year" })
  if (error) return { error: error.message }
  revalidatePath("/budget")
  return { success: true }
}

export async function saveCategoryCost(formData: FormData): Promise<void> {
  await updateCategoryCost(formData)
}
