export const PLANTILLA_STATUSES = [
  "Regular",
  "COS",
  "Outsourced",
  "Reserve",
  "For Transfer",
  "For RTS",
] as const

export const DEFAULT_EQUIPMENT_CATEGORIES = [
  "Laptop",
  "Tablet",
  "Desktop",
  "Drone",
  "Camera",
  "Printer",
] as const

export type PlantillaStatus = (typeof PLANTILLA_STATUSES)[number]

export function effectivePlantillaStatus(position: string | null | undefined, status: PlantillaStatus | null | undefined): PlantillaStatus {
  const normalizedPosition = position?.trim().toUpperCase() || ""
  if (/^PES\b/.test(normalizedPosition)) return "COS"
  if (/^(?:PSS|DRIVER|DE|DATA ENCODER)\b/.test(normalizedPosition)) return "Outsourced"
  if (/^SRS II\b/.test(normalizedPosition) && status === "Outsourced") return "Regular"
  return status || "Regular"
}

export type StoredEquipmentStatus = "Active" | "For Replacement" | "Retired"
export type LifecycleStatus = StoredEquipmentStatus | "Expiring soon"
export type EquipmentCondition = "Good" | "For Replacement" | "Broken"
export type EquipmentDisplayStatus = LifecycleStatus | "Broken"

const CATEGORY_ALIASES: ReadonlyArray<[RegExp, string]> = [
  [/\bmonitors?\b/i, "Monitors"],
  [/\b(?:headphones?|earbuds?)\b/i, "Headphones"],
  [/\b(?:printers?|scanners?)\b/i, "Printers & Scanners"],
  [/\bspeakers?\b/i, "Speakers"],
  [/\b(?:microphones?|mics?)\b/i, "Microphones"],
  [/\b(?:hubs?|splitters?)\b/i, "USB Hubs & Splitters"],
  [/\b(?:keyboards?|mice|mouses?)\b/i, "Keyboards & Mice"],
  [/\btablet\s+pen\b/i, "Tablet Accessories"],
  [/\bssd\b/i, "Storage"],
  [/\bpowerbanks?\b/i, "Powerbanks"],
  [/\bhotspots?\b/i, "Wi-Fi Hotspots"],
  [/\b(?:teleprompters?|presentations?|display\s+adapters?)\b/i, "Presentation Equipment"],
  [/\bvoice\s+recorders?\b/i, "Voice Recorders"],
  [/\btelephones?\b/i, "Telephones"],
  [/\bgimbals?\b/i, "GIMBAL"],
  [/\bradios?\b/i, "Radio Set"],
  [/\blaptops?\b/i, "Laptop"],
  [/\bdesktops?\b/i, "Desktop"],
  [/^tablets?$/i, "Tablet"],
  [/\bdrones?\b/i, "Drone"],
  [/\bcameras?\b/i, "Camera"],
]

export function canonicalEquipmentCategory(category: string | null | undefined) {
  const value = category?.trim() || ""
  return CATEGORY_ALIASES.find(([pattern]) => pattern.test(value))?.[1] || value
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
