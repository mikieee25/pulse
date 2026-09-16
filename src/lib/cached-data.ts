import "server-only"

import { unstable_cache } from "next/cache"
import { createAdminClient } from "@/utils/supabase/admin"
import type { AppRole } from "@/lib/auth"
import type { NotificationAssignment, NotificationEquipment } from "@/lib/notifications"
import { PULSE_CACHE_TAGS } from "@/lib/cache-tags"

export type EquipmentCategoryRecord = { id: string; name: string; lifespan_years: number | null }
export type DivisionRecord = { id: string; code: string; full_name: string }
export type PersonnelOptionRecord = { id: string; full_name: string; plantilla_status: string | null; division_id: string; position: string | null }
export type CategoryCostRecord = { category_id: string; year: number; unit_cost: number }
type CachedResult<T> = { data: T[]; error: string | null }

async function readCategories(): Promise<CachedResult<EquipmentCategoryRecord>> {
  const admin = createAdminClient()
  if (!admin) return { data: [], error: "Admin user configuration is incomplete." }
  const { data, error } = await admin.from("equipment_categories").select("id,name,lifespan_years").order("name")
  return { data: (data || []) as EquipmentCategoryRecord[], error: error?.message || null }
}

async function readDivisions(): Promise<CachedResult<DivisionRecord>> {
  const admin = createAdminClient()
  if (!admin) return { data: [], error: "Admin user configuration is incomplete." }
  const { data, error } = await admin.from("divisions").select("id,code,full_name").order("code")
  return { data: (data || []) as DivisionRecord[], error: error?.message || null }
}

async function readPersonnel(role: AppRole, divisionScope: string | null): Promise<CachedResult<PersonnelOptionRecord>> {
  const admin = createAdminClient()
  if (!admin) return { data: [], error: "Admin user configuration is incomplete." }
  if (role === "Viewer" && !divisionScope) return { data: [], error: null }
  let query = admin.from("personnel").select("id,full_name,plantilla_status,division_id,position").order("full_name")
  if (role === "Viewer" && divisionScope) query = query.eq("division_id", divisionScope)
  const { data, error } = await query
  return { data: (data || []) as PersonnelOptionRecord[], error: error?.message || null }
}

async function readCategoryCosts(year?: number): Promise<CachedResult<CategoryCostRecord>> {
  const admin = createAdminClient()
  if (!admin) return { data: [], error: "Admin user configuration is incomplete." }
  let query = admin.from("category_unit_costs").select("category_id,year,unit_cost").order("year", { ascending: false })
  if (year) query = query.eq("year", year)
  const { data, error } = await query
  return { data: (data || []) as CategoryCostRecord[], error: error?.message || null }
}

type NotificationSnapshot = {
  equipment: NotificationEquipment[]
  assignmentHistory: NotificationAssignment[]
  error: string | null
}

async function readNotifications(role: AppRole, divisionScope: string | null): Promise<NotificationSnapshot> {
  const admin = createAdminClient()
  if (!admin) return { equipment: [], assignmentHistory: [], error: "Admin user configuration is incomplete." }
  if (role === "Viewer" && !divisionScope) return { equipment: [], assignmentHistory: [], error: null }

  let equipmentQuery = admin.from("equipment").select("id,status,condition_state,year_acquired,assigned_to,assignee_id,division_id,equipment_categories(name,lifespan_years)")
  if (role === "Viewer" && divisionScope) equipmentQuery = equipmentQuery.eq("division_id", divisionScope)

  let historyQuery
  if (role === "Viewer" && divisionScope) {
    historyQuery = admin.from("assignment_history").select("id,assigned_at,note,personnel(full_name),equipment!inner(division_id)").eq("equipment.division_id", divisionScope).order("assigned_at", { ascending: false }).limit(5)
  } else {
    historyQuery = admin.from("assignment_history").select("id,assigned_at,note,personnel(full_name)").order("assigned_at", { ascending: false }).limit(5)
  }

  const [{ data: equipment, error: equipmentError }, { data: history, error: historyError }] = await Promise.all([equipmentQuery, historyQuery])
  const error = equipmentError || historyError
  const rawHistory = (history || []) as unknown as Array<{
    id: string
    assigned_at: string
    note: string | null
    personnel: NotificationAssignment["personnel"] | NotificationAssignment["personnel"][] | null
    equipment?: { division_id: string }
  }>
  const assignmentHistory = rawHistory.map((entry) => {
    const personnel = entry.personnel
    return {
      id: entry.id,
      assigned_at: entry.assigned_at,
      note: entry.note,
      personnel: Array.isArray(personnel) ? personnel[0] || null : personnel,
    }
  })
  return {
    equipment: (equipment || []) as unknown as NotificationEquipment[],
    assignmentHistory,
    error: error?.message || null,
  }
}

export const getCachedCategories = unstable_cache(readCategories, ["pulse-categories-v1"], {
  revalidate: 300,
  tags: [PULSE_CACHE_TAGS.categories],
})

export const getCachedDivisions = unstable_cache(readDivisions, ["pulse-divisions-v1"], {
  revalidate: 300,
  tags: [PULSE_CACHE_TAGS.divisions],
})

export const getCachedPersonnel = unstable_cache(readPersonnel, ["pulse-personnel-v1"], {
  revalidate: 60,
  tags: [PULSE_CACHE_TAGS.personnel],
})

export const getCachedCategoryCosts = unstable_cache(readCategoryCosts, ["pulse-costs-v1"], {
  revalidate: 60,
  tags: [PULSE_CACHE_TAGS.costs],
})

export const getCachedNotifications = unstable_cache(readNotifications, ["pulse-notifications-v1"], {
  revalidate: 30,
  tags: [PULSE_CACHE_TAGS.notifications],
})
