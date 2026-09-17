import {
  equipmentDisplayStatus,
  needsReplacement,
  type StoredEquipmentStatus,
} from "@/lib/pulse";

export type NotificationKind =
  "replacement" | "expiring" | "unassigned" | "activity";
export type NotificationTone = "alert" | "warning" | "pulse" | "slate";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  href: string;
  tone: NotificationTone;
  timestamp?: string | null;
};

export type NotificationEquipment = {
  id: string;
  status: StoredEquipmentStatus;
  condition_state: string;
  year_acquired: number | null;
  assigned_to: string | null;
  assignee_id: string | null;
  equipment_categories: { name: string; lifespan_years: number | null } | null;
};

export type NotificationAssignment = {
  id: string;
  assigned_at: string;
  note: string | null;
  personnel: { full_name: string } | null;
};

export type NotificationSnapshotCounts = {
  replacementCount: number;
  expiringCount: number;
  unassignedCount: number;
  recentAssignments: Array<{
    id: string;
    assigned_at: string;
    note: string | null;
    full_name: string | null;
  }>;
};

export function notificationId(kind: NotificationKind, equipmentIds: string[]) {
  return `${kind}:${[...equipmentIds].sort().join(",")}`;
}

export function buildNotifications(
  equipment: NotificationEquipment[],
  assignmentHistory: NotificationAssignment[],
  now = new Date()
): NotificationItem[] {
  const replacement = equipment.filter((item) =>
    needsReplacement(
      item.status,
      item.condition_state,
      item.equipment_categories?.lifespan_years,
      item.year_acquired,
      now
    )
  );

  const expiring = equipment.filter((item) => {
    const status = equipmentDisplayStatus(
      item.status,
      item.condition_state,
      item.equipment_categories?.lifespan_years,
      item.year_acquired,
      now
    );
    return status === "Expiring soon";
  });

  const unassigned = equipment.filter(
    (item) => !item.assigned_to && !item.assignee_id
  );
  const newestActivity = [...assignmentHistory]
    .filter((item) => item.assigned_at)
    .sort(
      (a, b) =>
        new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
    )[0];

  const notifications: NotificationItem[] = [];
  if (replacement.length) {
    notifications.push({
      id: notificationId(
        "replacement",
        replacement.map((item) => item.id)
      ),
      kind: "replacement",
      title: "For replacement",
      description: `${replacement.length} equipment ${replacement.length === 1 ? "unit needs" : "units need"} lifecycle attention.`,
      href: "/equipment?status=For+Replacement",
      tone: "alert",
    });
  }
  if (expiring.length) {
    notifications.push({
      id: notificationId(
        "expiring",
        expiring.map((item) => item.id)
      ),
      kind: "expiring",
      title: "Expiring soon",
      description: `${expiring.length} equipment ${expiring.length === 1 ? "unit is" : "units are"} expiring within one year.`,
      href: "/equipment?status=Expiring+soon",
      tone: "warning",
    });
  }
  if (unassigned.length) {
    notifications.push({
      id: notificationId(
        "unassigned",
        unassigned.map((item) => item.id)
      ),
      kind: "unassigned",
      title: "Unassigned equipment",
      description: `${unassigned.length} equipment ${unassigned.length === 1 ? "unit has" : "units have"} no custodian or assignee.`,
      href: "/equipment?assignment=unassigned",
      tone: "pulse",
    });
  }
  if (newestActivity) {
    const person = newestActivity.personnel?.full_name;
    notifications.push({
      id: "activity",
      kind: "activity",
      title: "Assignment activity",
      description: `${assignmentHistory.length} recent ${assignmentHistory.length === 1 ? "assignment record" : "assignment records"}${person ? ` · latest: ${person}` : ""}.`,
      href: "/reports",
      tone: "slate",
      timestamp: newestActivity.assigned_at,
    });
  }

  return notifications.slice(0, 4);
}

export function buildNotificationsFromSnapshot(
  snapshot: NotificationSnapshotCounts
): NotificationItem[] {
  const notifications: NotificationItem[] = [];
  if (snapshot.replacementCount)
    notifications.push({
      id: `replacement:${snapshot.replacementCount}`,
      kind: "replacement",
      title: "For replacement",
      description: `${snapshot.replacementCount} equipment ${snapshot.replacementCount === 1 ? "unit needs" : "units need"} lifecycle attention.`,
      href: "/equipment?status=For+Replacement",
      tone: "alert",
    });
  if (snapshot.expiringCount)
    notifications.push({
      id: `expiring:${snapshot.expiringCount}`,
      kind: "expiring",
      title: "Expiring soon",
      description: `${snapshot.expiringCount} equipment ${snapshot.expiringCount === 1 ? "unit is" : "units are"} expiring within one year.`,
      href: "/equipment?status=Expiring+soon",
      tone: "warning",
    });
  if (snapshot.unassignedCount)
    notifications.push({
      id: `unassigned:${snapshot.unassignedCount}`,
      kind: "unassigned",
      title: "Unassigned equipment",
      description: `${snapshot.unassignedCount} equipment ${snapshot.unassignedCount === 1 ? "unit has" : "units have"} no custodian or assignee.`,
      href: "/equipment?assignment=unassigned",
      tone: "pulse",
    });
  const latest = snapshot.recentAssignments[0];
  if (latest)
    notifications.push({
      id: `activity:${latest.id}`,
      kind: "activity",
      title: "Assignment activity",
      description: `${snapshot.recentAssignments.length} recent assignment records${latest.full_name ? ` · latest: ${latest.full_name}` : ""}.`,
      href: "/reports",
      tone: "slate",
      timestamp: latest.assigned_at,
    });
  return notifications;
}
