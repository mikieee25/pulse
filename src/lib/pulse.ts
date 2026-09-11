export const PLANTILLA_STATUSES = [
  "Regular",
  "COS",
  "Outsourced",
  "Reserve",
  "For Transfer",
  "For RTS",
] as const

export const EQUIPMENT_CATEGORIES = [
  "Laptop",
  "Tablet",
  "Desktop",
  "Drone",
  "Camera",
  "Printer",
] as const

export type PlantillaStatus = (typeof PLANTILLA_STATUSES)[number]
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number]
export type StoredEquipmentStatus = "Active" | "For Replacement" | "Retired"
export type LifecycleStatus = StoredEquipmentStatus | "Expiring soon"
export type EquipmentCondition = "Good" | "For Replacement" | "Broken"
export type EquipmentDisplayStatus = LifecycleStatus | "Broken"

export type InventoryCardRecord = {
  status: StoredEquipmentStatus
  condition_state: string | null | undefined
  category: string | null | undefined
  year_acquired: number | null | undefined
}

export function lifecycleStatus(
  status: StoredEquipmentStatus,
  category: string | null | undefined,
  yearAcquired: number | null | undefined,
  today = new Date(),
): LifecycleStatus {
  if (status === "Retired") return status
  const lifespan = category && ["Laptop", "Tablet", "Desktop"].includes(category) ? 3 : null
  if (!lifespan || !yearAcquired) return status

  const expiry = new Date(yearAcquired + lifespan, 0, 1)
  const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
  if (expiry <= today) return "For Replacement"
  if (expiry <= oneYearFromNow) return "Expiring soon"
  return "Active"
}

export function equipmentDisplayStatus(
  status: StoredEquipmentStatus,
  condition: string | null | undefined,
  category: string | null | undefined,
  yearAcquired: number | null | undefined,
  today = new Date(),
): EquipmentDisplayStatus {
  if (status === "Retired") return status
  if (condition === "Broken") return "Broken"
  if (condition === "For Replacement") return "For Replacement"
  return lifecycleStatus(status, category, yearAcquired, today)
}

export function needsReplacement(
  status: StoredEquipmentStatus,
  condition: string | null | undefined,
  category: string | null | undefined,
  yearAcquired: number | null | undefined,
  today = new Date(),
) {
  const displayStatus = equipmentDisplayStatus(status, condition, category, yearAcquired, today)
  return displayStatus === "For Replacement" || displayStatus === "Broken"
}

export function inventoryCardStats(records: InventoryCardRecord[], today = new Date()) {
  const statuses = records.map((record) => equipmentDisplayStatus(record.status, record.condition_state, record.category, record.year_acquired, today))
  const broken = statuses.filter((status) => status === "Broken").length
  const replacement = statuses.filter((status) => status === "For Replacement" || status === "Broken").length
  const expiring = statuses.filter((status) => status === "Expiring soon").length
  const active = statuses.filter((status) => status === "Active" || status === "For Replacement" || status === "Expiring soon").length
  return { total: statuses.length, active, replacement, expiring, broken }
}

export function monthsUntilExpiry(
  category: string | null | undefined,
  yearAcquired: number | null | undefined,
  today = new Date(),
) {
  if (!yearAcquired || !category || !["Laptop", "Tablet", "Desktop"].includes(category)) return null
  const expiry = new Date(yearAcquired + 3, 0, 1)
  return Math.ceil((expiry.getTime() - today.getTime()) / (30.44 * 24 * 60 * 60 * 1000))
}

export function suggestedInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}
