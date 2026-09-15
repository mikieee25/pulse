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

export function canonicalEquipmentCategory(category: string | null | undefined) {
  const value = category?.trim() || ""
  const normalized = value.toLowerCase()

  if (normalized.includes("monitor")) return "Monitors"
  if (normalized.includes("headphone") || normalized.includes("earbud")) return "Headphones"
  if (normalized.includes("printer") || normalized.includes("scanner")) return "Printers & Scanners"
  if (normalized.includes("speaker")) return "Speakers"
  if (normalized.includes("mic") || normalized.includes("microphone")) return "Microphones"
  if (normalized.includes("hub") || normalized.includes("splitter")) return "USB Hubs & Splitters"
  if (normalized.includes("keyboard") || normalized.includes("mouse")) return "Keyboards & Mice"
  if (normalized.includes("tablet pen")) return "Tablet Accessories"
  if (normalized.includes("ssd")) return "Storage"
  if (normalized.includes("powerbank")) return "Powerbanks"
  if (normalized.includes("hotspot")) return "Wi-Fi Hotspots"
  if (normalized.includes("teleprompter") || normalized.includes("presentation") || normalized.includes("display adapter")) {
    return "Presentation Equipment"
  }
  if (normalized.includes("voice recorder")) return "Voice Recorders"
  if (normalized.includes("telephone")) return "Telephones"
  if (normalized.includes("gimbal")) return "GIMBAL"
  if (normalized.includes("radio")) return "Radio Set"
  if (normalized.includes("laptop")) return "Laptop"
  if (normalized.includes("desktop")) return "Desktop"
  if (normalized === "tablet") return "Tablet"
  if (normalized.includes("drone")) return "Drone"
  if (normalized.includes("camera")) return "Camera"

  return value
}

export type InventoryCardRecord = {
  status: StoredEquipmentStatus
  condition_state: string | null | undefined
  lifespan_years: number | null | undefined
  year_acquired: number | null | undefined
}

export function lifecycleStatus(
  status: StoredEquipmentStatus,
  lifespanYears: number | null | undefined,
  yearAcquired: number | null | undefined,
  today = new Date(),
): LifecycleStatus {
  if (status === "Retired") return status
  if (!lifespanYears || !yearAcquired) return status

  const expiry = new Date(yearAcquired + lifespanYears, 0, 1)
  const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
  if (expiry <= today) return "For Replacement"
  if (expiry <= oneYearFromNow) return "Expiring soon"
  return "Active"
}

export function equipmentDisplayStatus(
  status: StoredEquipmentStatus,
  condition: string | null | undefined,
  lifespanYears: number | null | undefined,
  yearAcquired: number | null | undefined,
  today = new Date(),
): EquipmentDisplayStatus {
  if (status === "Retired") return status
  if (condition === "Broken") return "Broken"
  if (condition === "For Replacement") return "For Replacement"
  return lifecycleStatus(status, lifespanYears, yearAcquired, today)
}

export function needsReplacement(
  status: StoredEquipmentStatus,
  condition: string | null | undefined,
  lifespanYears: number | null | undefined,
  yearAcquired: number | null | undefined,
  today = new Date(),
) {
  const displayStatus = equipmentDisplayStatus(status, condition, lifespanYears, yearAcquired, today)
  return displayStatus === "For Replacement" || displayStatus === "Broken"
}

export function inventoryCardStats(records: InventoryCardRecord[], today = new Date()) {
  const statuses = records.map((record) => equipmentDisplayStatus(record.status, record.condition_state, record.lifespan_years, record.year_acquired, today))
  const broken = statuses.filter((status) => status === "Broken").length
  const replacement = statuses.filter((status) => status === "For Replacement" || status === "Broken").length
  const expiring = statuses.filter((status) => status === "Expiring soon").length
  const active = statuses.filter((status) => status === "Active" || status === "For Replacement" || status === "Expiring soon").length
  return { total: statuses.length, active, replacement, expiring, broken }
}

export function monthsUntilExpiry(
  lifespanYears: number | null | undefined,
  yearAcquired: number | null | undefined,
  today = new Date(),
) {
  if (!yearAcquired || !lifespanYears) return null
  const expiry = new Date(yearAcquired + lifespanYears, 0, 1)
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
