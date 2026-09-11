import { equipmentDisplayStatus, needsReplacement, type StoredEquipmentStatus } from "@/lib/pulse"

export type NotificationKind = "replacement" | "expiring" | "unassigned" | "activity"
export type NotificationTone = "alert" | "warning" | "pulse" | "slate"

export type NotificationItem = {
  id: string
  kind: NotificationKind
  title: string
  description: string
  href: string
  tone: NotificationTone
  timestamp?: string | null
}

export type NotificationEquipment = {
  id: string
  status: StoredEquipmentStatus
  condition_state: string
  year_acquired: number | null
  assigned_to: string | null
  assignee_id: string | null
  equipment_categories: { name: string } | null
}

export type NotificationAssignment = {
  id: string
  assigned_at: string
  note: string | null
  personnel: { full_name: string } | null
}

export function buildNotifications(
  equipment: NotificationEquipment[],
  assignmentHistory: NotificationAssignment[],
  now = new Date(),
): NotificationItem[] {
  const replacementCount = equipment.filter((item) => needsReplacement(item.status, item.condition_state, item.equipment_categories?.name, item.year_acquired, now)).length

  const expiringCount = equipment.filter((item) => {
    const status = equipmentDisplayStatus(item.status, item.condition_state, item.equipment_categories?.name, item.year_acquired, now)
    return status === "Expiring soon"
  }).length

  const unassignedCount = equipment.filter((item) => !item.assigned_to && !item.assignee_id).length
  const newestActivity = [...assignmentHistory]
    .filter((item) => item.assigned_at)
    .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())[0]

  const notifications: NotificationItem[] = []
  if (replacementCount) {
    notifications.push({
      id: "replacement",
      kind: "replacement",
      title: "For replacement",
      description: `${replacementCount} equipment ${replacementCount === 1 ? "unit needs" : "units need"} lifecycle attention.`,
      href: "/equipment",
      tone: "alert",
    })
  }
  if (expiringCount) {
    notifications.push({
      id: "expiring",
      kind: "expiring",
      title: "Expiring soon",
      description: `${expiringCount} equipment ${expiringCount === 1 ? "unit is" : "units are"} expiring within one year.`,
      href: "/equipment",
      tone: "warning",
    })
  }
  if (unassignedCount) {
    notifications.push({
      id: "unassigned",
      kind: "unassigned",
      title: "Unassigned equipment",
      description: `${unassignedCount} equipment ${unassignedCount === 1 ? "unit has" : "units have"} no custodian or assignee.`,
      href: "/equipment",
      tone: "pulse",
    })
  }
  if (newestActivity) {
    const person = newestActivity.personnel?.full_name
    notifications.push({
      id: "activity",
      kind: "activity",
      title: "Assignment activity",
      description: `${assignmentHistory.length} recent ${assignmentHistory.length === 1 ? "assignment record" : "assignment records"}${person ? ` · latest: ${person}` : ""}.`,
      href: "/reports",
      tone: "slate",
      timestamp: newestActivity.assigned_at,
    })
  }

  return notifications.slice(0, 4)
}
