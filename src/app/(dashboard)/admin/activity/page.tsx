import { Activity as ActivityIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminActivity } from "@/components/admin/admin-activity";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentProfile } from "@/lib/auth";
import { getAdminActivityPage, getAdminUserStatus } from "@/lib/admin-activity";
import { getCachedDivisions } from "@/lib/cached-data";
import type { ActivityAction, ActivityEntity } from "@/lib/activity-format";

const actions = new Set<ActivityAction>([
  "created",
  "updated",
  "deleted",
  "assigned",
  "reassigned",
  "retired",
  "state_changed",
]);
const entities = new Set<ActivityEntity>([
  "equipment",
  "personnel",
  "division",
  "equipment_category",
  "category_unit_cost",
  "user",
]);

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function uuidOrUndefined(value: string | undefined) {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : undefined;
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "Admin") redirect("/");
  const params = await searchParams;
  const action = valueOf(params.action);
  const entityType = valueOf(params.entity);
  const page = Number(valueOf(params.page) || 1);
  const from = valueOf(params.from);
  const to = valueOf(params.to);
  const eventId = valueOf(params.event);
  const entityId = valueOf(params.entityId);
  const filters = {
    actorUserId: valueOf(params.user),
    action: actions.has(action as ActivityAction)
      ? (action as ActivityAction)
      : undefined,
    entityType: entities.has(entityType as ActivityEntity)
      ? (entityType as ActivityEntity)
      : undefined,
    divisionId: valueOf(params.division),
    from: from ? `${from}T00:00:00.000Z` : undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
    eventId: uuidOrUndefined(eventId),
    entityId: uuidOrUndefined(entityId),
    page: Number.isFinite(page) ? page : 1,
  };
  const [activity, statuses, divisions] = await Promise.all([
    getAdminActivityPage(filters),
    getAdminUserStatus(),
    getCachedDivisions(),
  ]);
  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <ActivityIcon className="size-3.5" aria-hidden="true" />
            Administration
          </span>
        }
        title="Admin Activity"
        description="Track successful changes and user presence across every division."
      />
      <AdminActivity
        activity={activity}
        statuses={statuses}
        divisions={divisions.data.map(({ id, code }) => ({ id, code }))}
        filters={filters}
      />
    </div>
  );
}
