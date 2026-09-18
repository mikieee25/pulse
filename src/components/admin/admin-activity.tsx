"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, CircleAlert, UserRound } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { SectionPanel } from "@/components/layout/section-panel";
import { ActivityRetry } from "@/components/admin/activity-retry";
import {
  formatActivityMessage,
  type ActivityFilters,
  type ActivityPageResult,
  type ActivityRecord,
  type UserStatusResult,
} from "@/lib/activity-format";
import { formatLastSeen, isActiveNow } from "@/lib/presence";
import { TablePageSizeSelect } from "@/components/layout/table-page-size-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-between gap-4 p-5 text-sm text-alert">
      <span className="inline-flex items-center gap-2">
        <CircleAlert className="size-4" aria-hidden="true" />
        {message}
      </span>
      <ActivityRetry />
    </div>
  );
}

export function AdminActivity({
  activity,
  statuses,
  divisions = [],
  filters = {},
}: {
  activity: ActivityPageResult;
  statuses: UserStatusResult;
  divisions?: Array<{ id: string; code: string }>;
  filters?: ActivityFilters;
}) {
  const [statusPageSize, setStatusPageSize] = useState(25);
  const nextPage = new URLSearchParams();
  if (filters.actorUserId) nextPage.set("user", filters.actorUserId);
  if (filters.action) nextPage.set("action", filters.action);
  if (filters.entityType) nextPage.set("entity", filters.entityType);
  if (filters.divisionId) nextPage.set("division", filters.divisionId);
  if (filters.from) nextPage.set("from", filters.from.slice(0, 10));
  if (filters.to) nextPage.set("to", filters.to.slice(0, 10));
  if (filters.eventId) nextPage.set("event", filters.eventId);
  if (filters.entityId) nextPage.set("entityId", filters.entityId);
  nextPage.set("page", String((filters.page || 1) + 1));
  return (
    <div className="space-y-6">
      <SectionPanel
        title="User status"
        description="Live presence and Supabase authentication activity across all divisions."
        actions={
          <TablePageSizeSelect
            value={statusPageSize}
            onChange={setStatusPageSize}
          />
        }
      >
        {statuses.error && !statuses.data.length ? (
          <ErrorState message={statuses.error} />
        ) : !statuses.data.length ? (
          <EmptyState
            title="No registered users"
            description="User status will appear after accounts are registered."
            icon={UserRound}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <caption className="sr-only">PULSE user status</caption>
                <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
                  <tr>
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Division</th>
                    <th className="px-4 py-3 font-medium">Last Seen</th>
                    <th className="px-4 py-3 font-medium">Last Sign In</th>
                  </tr>
                </thead>
                <tbody>
                  {statuses.data.slice(0, statusPageSize).map((user) => (
                    <tr key={user.id} className="border-b border-line/50">
                      <th
                        scope="row"
                        className="px-5 py-4 text-left font-medium text-paper"
                      >
                        <div>{user.fullName}</div>
                        <div className="text-xs font-normal text-slate">
                          {user.email}
                        </div>
                      </th>
                      <td className="px-4 py-4 text-slate">{user.role}</td>
                      <td className="px-4 py-4 text-slate">
                        {user.divisionName || "All divisions"}
                      </td>
                      <td className="px-4 py-4">
                        {isActiveNow(user.lastSeenAt) ? (
                          <span className="inline-flex items-center gap-2 text-emerald-500">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            Active now
                          </span>
                        ) : (
                          <span className="text-slate">
                            {formatLastSeen(user.lastSeenAt)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate">
                        {user.lastSignInAt
                          ? new Intl.DateTimeFormat("en-PH", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(user.lastSignInAt))
                          : "Unavailable"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SectionPanel>
      <SectionPanel
        title="Activity history"
        description="Successful data changes, newest first."
      >
        <form
          method="get"
          className="m-4 grid grid-cols-1 gap-3 rounded-xl border border-line bg-canvas/80 p-3 sm:grid-cols-2 2xl:grid-cols-[minmax(14rem,2fr)_repeat(7,minmax(7rem,1fr))_auto]"
        >
          <NativeSelect
            name="user"
            wrapperClassName="w-full"
            defaultValue={filters.actorUserId || ""}
            aria-label="Filter by user"
            className="h-10 w-full rounded-lg border border-line bg-canvas-deep pl-3 pr-10 text-sm text-paper"
          >
            <option value="">All users</option>
            {statuses.data.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            name="action"
            wrapperClassName="w-full"
            defaultValue={filters.action || ""}
            aria-label="Filter by action"
            className="h-10 w-full rounded-lg border border-line bg-canvas-deep pl-3 pr-10 text-sm text-paper"
          >
            <option value="">All actions</option>
            {[
              "created",
              "updated",
              "deleted",
              "assigned",
              "reassigned",
              "retired",
              "state_changed",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </NativeSelect>
          <NativeSelect
            name="entity"
            wrapperClassName="w-full"
            defaultValue={filters.entityType || ""}
            aria-label="Filter by module"
            className="h-10 w-full rounded-lg border border-line bg-canvas-deep pl-3 pr-10 text-sm text-paper"
          >
            <option value="">All modules</option>
            {[
              "equipment",
              "personnel",
              "division",
              "equipment_category",
              "category_unit_cost",
              "user",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </NativeSelect>
          <NativeSelect
            name="division"
            wrapperClassName="w-full"
            defaultValue={filters.divisionId || ""}
            aria-label="Filter by division"
            className="h-10 w-full rounded-lg border border-line bg-canvas-deep pl-3 pr-10 text-sm text-paper"
          >
            <option value="">All divisions</option>
            {divisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.code}
              </option>
            ))}
          </NativeSelect>
          <Input
            name="event"
            defaultValue={filters.eventId || ""}
            aria-label="Filter by event ID"
            placeholder="Event ID"
            className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper"
          />
          <Input
            name="entityId"
            defaultValue={filters.entityId || ""}
            aria-label="Filter by entity ID"
            placeholder="Entity ID"
            className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper"
          />
          <label className="flex min-w-0 flex-col gap-1 text-xs text-slate">
            <Input
              id="activity-from-date"
              name="from"
              type="date"
              defaultValue={filters.from?.slice(0, 10) || ""}
              aria-label="From date"
              className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs text-slate">
            <Input
              id="activity-to-date"
              name="to"
              type="date"
              defaultValue={filters.to?.slice(0, 10) || ""}
              aria-label="To date"
              className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper"
            />
          </label>
          <div className="flex items-end justify-start gap-2 sm:col-span-2 2xl:col-span-1">
            <Button type="submit" size="action">
              Apply
            </Button>
            <Link
              href="/admin/activity"
              aria-label="Clear activity filters"
              className="inline-flex h-10 items-center whitespace-nowrap rounded-lg border border-line px-4 text-sm text-slate hover:text-paper"
            >
              Clear
            </Link>
          </div>
        </form>
        {activity.error ? (
          <ErrorState message={activity.error} />
        ) : !activity.data.length ? (
          <EmptyState
            title="No activity yet"
            description="Successful administrative changes will appear here."
            icon={Activity}
          />
        ) : (
          <div className="divide-y divide-line/60">
            {activity.data.map((entry) => (
              <ActivityEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
        {activity.hasMore && (
          <div className="border-t border-line p-4 text-center">
            <Link
              href={`/admin/activity?${nextPage.toString()}`}
              className="text-sm font-medium text-pulse hover:underline"
            >
              Load more activity
            </Link>
          </div>
        )}
      </SectionPanel>
    </div>
  );
}

export function ActivityPreview({
  data,
  error,
}: {
  data: ActivityRecord[];
  error: string | null;
}) {
  return (
    <SectionPanel
      title="Recent Activity"
      description="The five newest successful administrative changes."
      actions={
        <Link
          href="/admin/activity"
          className="text-sm font-medium text-pulse hover:underline"
        >
          View all activity
        </Link>
      }
    >
      {error ? (
        <ErrorState message={error} />
      ) : !data.length ? (
        <EmptyState
          title="No activity yet"
          description="Successful changes will appear here."
          icon={Activity}
        />
      ) : (
        <div className="divide-y divide-line/60">
          {data.map((entry) => (
            <ActivityEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </SectionPanel>
  );
}

function ActivityEntry({ entry }: { entry: ActivityRecord }) {
  const metadata = entry.metadata || {};
  const before = isRecord(metadata.before) ? metadata.before : null;
  const after = isRecord(metadata.after) ? metadata.after : null;
  const changedFields = Array.isArray(metadata.changedFields)
    ? metadata.changedFields.filter(
        (field): field is string => typeof field === "string"
      )
    : [];
  const relatedHref = entry.entityId
    ? entry.entityType === "equipment"
      ? `/equipment/${entry.entityId}`
      : entry.entityType === "personnel"
        ? "/personnel"
        : entry.entityType === "division"
          ? "/divisions"
          : entry.entityType === "user"
            ? "/admin/users"
            : entry.entityType === "category_unit_cost"
              ? "/budget"
              : "/equipment"
    : null;
  const source = formatAuditValue(metadata.source);
  const reason = formatAuditValue(metadata.reason);
  const relatedLabel =
    entry.entityType === "equipment"
      ? "Open related equipment"
      : `Open ${entry.entityType.replaceAll("_", " ")} records`;
  return (
    <article className="flex gap-3 p-4">
      <div className="mt-0.5 flex size-9 min-w-9 shrink-0 aspect-square items-center justify-center rounded-lg bg-pulse/10 p-2 text-pulse">
        <Activity className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-paper">{formatActivityMessage(entry)}</p>
        <p className="mt-1 text-xs text-slate">
          {entry.divisionName || "All divisions"} · {entry.actorEmail}
        </p>
        <details className="mt-2 text-xs text-slate">
          <summary className="cursor-pointer font-medium text-pulse hover:underline">
            View details
          </summary>
          <div className="mt-3 grid gap-2 rounded-lg border border-line bg-canvas/60 p-3 sm:grid-cols-2">
            <p>
              <span className="font-medium text-paper">Event ID:</span>{" "}
              <code>{entry.id}</code>
            </p>
            <p>
              <span className="font-medium text-paper">Entity ID:</span>{" "}
              <code>{entry.entityId || "—"}</code>
            </p>
            <p className="sm:col-span-2">
              <span className="font-medium text-paper">Exact timestamp:</span>{" "}
              <time dateTime={entry.createdAt} title={entry.createdAt}>
                {entry.createdAt}
              </time>
            </p>
            {relatedHref && (
              <p>
                <Link className="text-pulse hover:underline" href={relatedHref}>
                  {relatedLabel}
                </Link>
              </p>
            )}
            {source !== "—" && (
              <p>
                <span className="font-medium text-paper">Source:</span> {source}
              </p>
            )}
            {reason !== "—" && (
              <p>
                <span className="font-medium text-paper">Reason:</span> {reason}
              </p>
            )}
            {changedFields.length ? (
              <div className="sm:col-span-2">
                <p className="font-medium text-paper">Changed fields</p>
                <dl className="mt-1 divide-y divide-line/60 rounded border border-line">
                  {changedFields.map((field) => (
                    <div
                      key={field}
                      className="grid gap-1 px-2 py-1.5 sm:grid-cols-[9rem_1fr_1fr]"
                    >
                      <dt className="font-medium text-paper">{field}</dt>
                      <dd>
                        <span className="text-slate">Before:</span>{" "}
                        {formatAuditValue(before?.[field])}
                      </dd>
                      <dd>
                        <span className="text-slate">After:</span>{" "}
                        {formatAuditValue(after?.[field])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="sm:col-span-2">
                No additional audit details recorded for this event.
              </p>
            )}
          </div>
        </details>
      </div>
    </article>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatAuditValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
