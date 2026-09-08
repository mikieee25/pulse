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
