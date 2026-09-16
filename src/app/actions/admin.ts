"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"
import { requireProfile } from "@/lib/auth"
import { buildTemporaryUserAttributes, validateTemporaryPassword } from "@/lib/temporary-password"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { recordActivity } from "@/lib/admin-activity"
import { PULSE_CACHE_TAGS } from "@/lib/cache-tags"

const userInput = z.object({ email: z.email(), full_name: z.string().trim().min(1), role: z.enum(["Admin", "Viewer"]), division_scope: z.string().uuid().nullable() })
const newUserInput = userInput.extend({ temporary_password: z.string() })
const userId = z.uuid()

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
    const { error: rollbackError } = await admin.auth.admin.deleteUser(data.user.id)
    return { error: rollbackError ? `${profileError.message} Cleanup also failed; remove the Auth user manually.` : profileError.message }
  }
  await recordActivity({ action: "created", entityType: "user", entityId: data.user.id, entityLabel: profile.full_name, divisionId: profile.division_scope })
  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateUser(id: string, input: Pick<z.infer<typeof userInput>, "role" | "division_scope">) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  if (!userId.safeParse(id).success) return { error: "Invalid user." }
  const parsed = z.object({ role: z.enum(["Admin", "Viewer"]), division_scope: z.string().uuid().nullable() }).safeParse(input)
  if (!parsed.success) return { error: "Invalid user settings." }
  const supabase = await createClient()
  if (id === access.profile.id && parsed.data.role !== "Admin") return { error: "You cannot remove your own administrator access." }
  const { data: target, error: targetError } = await supabase.from("app_users").select("id,role,full_name,email,division_scope").eq("id", id).single()
  if (targetError || !target) return { error: "User not found." }
  if (target.role === "Admin" && parsed.data.role !== "Admin") {
    const { count } = await supabase.from("app_users").select("id", { count: "exact", head: true }).eq("role", "Admin")
    if ((count || 0) <= 1) return { error: "At least one administrator must remain." }
  }
  const { error } = await supabase.from("app_users").update(parsed.data).eq("id", id)
  if (error) return { error: error.message }
  await recordActivity({ action: "updated", entityType: "user", entityId: id, entityLabel: target.full_name, divisionId: parsed.data.division_scope })
  revalidatePath("/admin/users")
  return { success: true }
}

export async function deleteUser(id: string) {
  const access = await requireProfile("Admin")
  if (access.error) return access
  if (!userId.safeParse(id).success) return { error: "Invalid user." }
  if (id === access.profile.id) return { error: "You cannot delete your own account." }
  const admin = createAdminClient()
  if (!admin) return { error: "Admin user configuration is incomplete." }
  const { data: target, error: targetError } = await admin.from("app_users").select("id,email,full_name,role,division_scope").eq("id", id).single()
  if (targetError || !target) return { error: "User not found." }
  if (target.role === "Admin") {
    const { count } = await admin.from("app_users").select("id", { count: "exact", head: true }).eq("role", "Admin")
    if ((count || 0) <= 1) return { error: "At least one administrator must remain." }
  }
  const { error: profileError } = await admin.from("app_users").delete().eq("id", id)
  if (profileError) return { error: profileError.message }

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    await admin.from("app_users").insert(target)
    return { error: error.message }
  }

  await recordActivity({ action: "deleted", entityType: "user", entityId: id, entityLabel: target.full_name, divisionId: target.division_scope })
  
  revalidatePath("/admin/users")
  return { success: true }
}

export type CategoryCostState = { error: string; success: boolean }

export async function saveCategoryCost(_previousState: CategoryCostState, formData: FormData): Promise<CategoryCostState> {
  const access = await requireProfile("Admin")
  if (access.error) return { error: access.error, success: false }
  const categoryId = z.string().uuid().safeParse(formData.get("category_id"))
  const year = z.coerce.number().int().min(2000).max(2100).safeParse(formData.get("year"))
  const unitCost = z.coerce.number().nonnegative().safeParse(formData.get("unit_cost"))
  if (!categoryId.success || !year.success || !unitCost.success) return { error: "Invalid cost values.", success: false }
  const supabase = await createClient()
  const { error } = await supabase.from("category_unit_costs").upsert({ category_id: categoryId.data, year: year.data, unit_cost: unitCost.data }, { onConflict: "category_id,year" })
  if (error) return { error: error.message, success: false }
  await recordActivity({ action: "updated", entityType: "category_unit_cost", entityId: categoryId.data, entityLabel: `Category cost for ${year.data}` })
  revalidatePath("/budget")
  revalidateTag(PULSE_CACHE_TAGS.costs, "max")
  return { error: "", success: true }
}
