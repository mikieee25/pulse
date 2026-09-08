"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireProfile } from "@/lib/auth"
import { buildTemporaryUserAttributes, validateTemporaryPassword } from "@/lib/temporary-password"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

const userInput = z.object({ email: z.email(), full_name: z.string().trim().min(1), role: z.enum(["Admin", "Viewer"]), division_scope: z.string().uuid().nullable() })
const newUserInput = userInput.extend({ temporary_password: z.string() })

export async function createUser(input: z.infer<typeof newUserInput>) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  const parsed = newUserInput.safeParse(input)
  if (!parsed.success) return { error: "Enter valid user details." }
  const passwordError = validateTemporaryPassword(parsed.data.temporary_password)
  if (passwordError) return { error: passwordError }
  const admin = createAdminClient()
  if (!admin) return { error: "Admin user configuration is incomplete." }
  const { temporary_password, ...profile } = parsed.data
  const { data, error } = await admin.auth.admin.createUser(buildTemporaryUserAttributes(profile.email, temporary_password))
  if (error || !data.user) return { error: error?.message || "Could not create user." }
  const { error: profileError } = await admin.from("app_users").insert({ id: data.user.id, ...profile })
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id)
    return { error: profileError.message }
  }
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
