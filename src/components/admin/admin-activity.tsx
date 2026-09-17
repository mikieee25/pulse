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
  nextPage.set("page", String((filters.page || 1) + 1));
  return (
    <div className="space-y-6">
      <SectionPanel
        title="User status"
        description="Live presence and Supabase authentication activity across all divisions."
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
            <div className="flex justify-end border-b border-line px-5 py-3">
              <TablePageSizeSelect
                value={statusPageSize}
                onChange={setStatusPageSize}
              />
            </div>
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
          className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-6"
        >
          <select
            name="user"
            defaultValue={filters.actorUserId || ""}
            aria-label="Filter by user"
            className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-paper"
          >
            <option value="">All users</option>
            {statuses.data.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </select>
          <select
            name="action"
            defaultValue={filters.action || ""}
            aria-label="Filter by action"
            className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-paper"
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
          </select>
          <select
            name="entity"
            defaultValue={filters.entityType || ""}
            aria-label="Filter by module"
            className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-paper"
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
          </select>
          <select
            name="division"
            defaultValue={filters.divisionId || ""}
            aria-label="Filter by division"
            className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-paper"
          >
            <option value="">All divisions</option>
            {divisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.code}
              </option>
            ))}
          </select>
          <input
            name="from"
            type="date"
            defaultValue={filters.from?.slice(0, 10) || ""}
            aria-label="From date"
            className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-paper"
          />
          <div className="flex gap-2">
            <input
              name="to"
              type="date"
              defaultValue={filters.to?.slice(0, 10) || ""}
              aria-label="To date"
              className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 text-sm text-paper"
            />
            <button
              type="submit"
              className="rounded-lg bg-pulse px-3 text-xs font-semibold text-white"
            >
              Filter
            </button>
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
  return (
    <article className="flex gap-3 p-4">
      <div className="mt-0.5 rounded-lg bg-pulse/10 p-2 text-pulse">
        <Activity className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-paper">{formatActivityMessage(entry)}</p>
        <p className="mt-1 text-xs text-slate">
          {entry.divisionName || "All divisions"} · {entry.actorEmail}
        </p>
      </div>
    </article>
  );
}
