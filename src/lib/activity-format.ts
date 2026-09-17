import type { AppRole } from "@/lib/auth";

export type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "assigned"
  | "reassigned"
  | "retired"
  | "state_changed";
export type ActivityEntity =
  | "equipment"
  | "personnel"
  | "division"
  | "equipment_category"
  | "category_unit_cost"
  | "user";
export type ActivityInput = {
  action: ActivityAction;
  entityType: ActivityEntity;
  entityId?: string | null;
  entityLabel: string;
  divisionId?: string | null;
  divisionName?: string | null;
  metadata?: Record<string, unknown>;
};
export type ActivityRecord = ActivityInput & {
  id: string;
  actorUserId: string;
  actorName: string;
  actorEmail: string;
  createdAt: string;
};

const verbs: Record<ActivityAction, string> = {
  created: "added",
  updated: "updated",
  deleted: "deleted",
  assigned: "assigned",
  reassigned: "reassigned",
  retired: "retired",
  state_changed: "changed the state of",
};

export function formatActivityMessage(activity: ActivityRecord) {
  const timestamp = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(activity.createdAt));
  return `${activity.actorName} ${verbs[activity.action]} ${activity.entityLabel} on ${timestamp}.`;
}

export type ActivityFilters = {
  actorUserId?: string;
  action?: ActivityAction;
  entityType?: ActivityEntity;
  divisionId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type ActivityRecordResult = {
  data: ActivityRecord[];
  error: string | null;
};
export type ActivityPageResult = ActivityRecordResult & { hasMore: boolean };
export type UserStatus = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  divisionName: string | null;
  lastSeenAt: string | null;
  lastSignInAt: string | null;
};
export type UserStatusResult = { data: UserStatus[]; error: string | null };
