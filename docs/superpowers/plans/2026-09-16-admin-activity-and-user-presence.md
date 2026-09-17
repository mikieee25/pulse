# PULSE Admin Activity and User Presence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global Admin-only activity feed plus five-minute user presence and Supabase Last Sign In status to PULSE.

**Architecture:** Store successful mutation events in an append-only `activity_log` table and current heartbeats in `user_presence`. Trusted server actions write both through the service-role client after validating the signed-in user; RLS exposes read access only to global Admins. A dynamic Admin activity page combines server-side application data with Supabase Auth sign-in timestamps, while the dashboard shows the five newest events.

**Tech Stack:** Next.js 16.3.4 App Router, React 19, TypeScript, Supabase Auth/Postgres/RLS, Supabase CLI, Tailwind CSS v4, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-16-admin-activity-and-user-presence-design.md`

## Global Constraints

- The feature is global: Admins can see activity and status across every division.
- Viewers and any future division-scoped roles cannot access activity or presence information.
- `Active now` means `last_seen_at` is within the previous five minutes.
- Heartbeats run approximately once per minute only while the PULSE document is visible.
- Activity records are created only after successful mutations; failed or cancelled mutations create no success entry.
- Activity records are append-only from the application perspective.
- Do not duplicate Supabase Auth `last_sign_in_at` into application tables.
- Supabase service-role credentials remain server-only.
- New exposed tables must have RLS enabled and explicit grants/policies.
- Existing assignment history remains intact.
- Do not add activity entries for page views, heartbeats, filters, or other read-only actions.
- Do not add a dependency; use existing Supabase, React, Tailwind, and Node test tooling.

---

## File map

Create:

- `supabase/migrations/` migration file emitted by `supabase migration new admin_activity_presence` — tables, indexes, grants, and Admin-only RLS policies.
- `src/app/actions/presence.ts` — authenticated server heartbeat action.
- `src/lib/activity-format.ts` — pure activity action/entity types and human-readable message formatting.
- `src/lib/admin-activity.ts` — server-only activity recorder, Admin feed queries, and user-status query.
- `src/lib/presence.ts` — pure five-minute status calculation and relative-time formatting helpers.
- `src/components/presence/presence-heartbeat.tsx` — visible-page heartbeat client component.
- `src/components/admin/admin-activity.tsx` — Admin activity feed, filters, timeline, status table, and loading/error/empty states.
- `src/app/(dashboard)/admin/activity/page.tsx` — Admin-only activity route and server data composition.
- `src/app/(dashboard)/admin/activity/loading.tsx` — route loading state.
- `tests/admin-activity-format.test.mjs` — message and label contract tests.
- `tests/admin-activity-security.test.mjs` — migration and Admin-only access contract tests.
- `tests/admin-activity-integration-contract.test.mjs` — supported mutation instrumentation contracts.
- `tests/presence.test.mjs` — five-minute boundary and heartbeat behavior contracts.

Modify:

- `src/app/actions/equipment.ts` — record equipment create/update/assignment/retirement/state events.
- `src/app/actions/personnel.ts` — record personnel create/update/delete events.
- `src/app/actions/divisions.ts` — record division create/update events.
- `src/app/actions/equipment-categories.ts` — record category creation events.
- `src/app/actions/admin.ts` — record user and category-cost mutations.
- `src/app/(dashboard)/layout.tsx` — mount the presence heartbeat and pass Admin visibility to navigation.
- `src/components/layout/sidebar.tsx` — show Admin activity navigation only to global Admins.
- `src/app/(dashboard)/admin/page.tsx` — render the five-event Recent Activity preview and link.
- `tests/performance-contract.test.mjs` — preserve cached existing data paths and assert activity is not incorrectly cached as stale global data.

---

### Task 1: Add the Supabase activity and presence schema

**Files:**

- Create: the exact timestamped file emitted by `supabase migration new admin_activity_presence` under `supabase/migrations/`.
- Test: `tests/admin-activity-security.test.mjs`

**Interfaces:**

- Produces the database tables consumed by `src/lib/admin-activity.ts` and `src/app/actions/presence.ts`.

- [ ] **Step 1: Create the migration with the CLI**

Run:

```bash
supabase migration new admin_activity_presence
```

Use the path printed by the CLI as the migration file for the remaining steps. Confirm the linked project and CLI syntax with `supabase --help` and `supabase migration --help` if needed; do not invent a migration filename.

- [ ] **Step 2: Write failing SQL contract tests**

Add assertions to `tests/admin-activity-security.test.mjs` that read the generated migration and require these strings/conditions:

```js
assert.match(source, /create table activity_log/i);
assert.match(source, /create table user_presence/i);
assert.match(source, /enable row level security/i);
assert.match(source, /current_user_role\(\).*Admin/is);
assert.match(source, /grant select on activity_log to authenticated/i);
assert.match(source, /grant select on user_presence to authenticated/i);
assert.doesNotMatch(
  source,
  /grant (all|insert|update|delete).*activity_log to authenticated/i
);
```

Run:

```bash
node --import tsx --test tests/admin-activity-security.test.mjs
```

Expected: FAIL because the tables and policies do not exist.

- [ ] **Step 3: Implement the migration**

Create `activity_log` with UUID `id`, non-null actor snapshots, constrained text `action` and `entity_type`, nullable entity/division IDs, readable entity/division snapshots, JSONB `metadata` defaulting to `{}`, and server-defaulted `created_at timestamptz`.

Do not foreign-key `actor_user_id` or `division_id`; historical activity must remain readable after an account or division is removed. Add indexes for `created_at desc`, actor, action/entity type, and division.

Create `user_presence` with `user_id uuid primary key`, `last_seen_at timestamptz not null`, and `updated_at timestamptz not null`.

Enable RLS on both tables. Grant only `select` to `authenticated`. Add Admin-only `select` policies using the existing `private.current_user_role()` helper. Do not create authenticated insert/update/delete policies; the trusted server actions use `createAdminClient()` and clients must not write arbitrary actor IDs or timestamps.

- [ ] **Step 4: Run the contract test**

Run:

```bash
node --import tsx --test tests/admin-activity-security.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Validate and commit the schema**

Run the repository’s Supabase migration checks and, after reviewing the SQL, apply it through the linked CLI using the discovered `supabase db push` command. Verify both tables, RLS, grants, indexes, and policies with a read-only SQL query or the project’s migration verification command.

Commit:

```bash
git add supabase/migrations tests/admin-activity-security.test.mjs
git commit -m "feat: add admin activity and presence schema"
```

### Task 2: Build the server activity and status data layer

**Files:**

- Create: `src/lib/activity-format.ts`
- Create: `src/lib/presence.ts`
- Create: `src/lib/admin-activity.ts`
- Test: `tests/admin-activity-format.test.mjs`
- Test: `tests/presence.test.mjs`

**Interfaces:**

```ts
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
export function formatActivityMessage(activity: ActivityRecord): string;
export function isActiveNow(lastSeenAt: string | null, now?: Date): boolean;
export async function recordActivity(input: ActivityInput): Promise<void>;
export async function getRecentAdminActivity(
  limit: number
): Promise<ActivityRecordResult>;
export async function getAdminActivityPage(
  filters: ActivityFilters
): Promise<ActivityPageResult>;
export async function getAdminUserStatus(): Promise<UserStatusResult>;
```

- [ ] **Step 1: Write pure failing tests**

`tests/admin-activity-format.test.mjs` must verify messages for equipment creation, personnel update, assignment, and deletion, including the actor and formatted timestamp.

`tests/presence.test.mjs` must verify:

```js
assert.equal(
  isActiveNow("2026-09-16T10:00:00.000Z", new Date("2026-09-16T10:05:00.000Z")),
  true
);
assert.equal(
  isActiveNow("2026-09-16T09:59:59.999Z", new Date("2026-09-16T10:05:00.000Z")),
  false
);
assert.equal(isActiveNow(null, new Date("2026-09-16T10:05:00.000Z")), false);
```

Run both tests and expect failure because the helpers do not exist.

- [ ] **Step 2: Implement pure formatting and presence helpers**

Keep action/entity vocabulary in one place. Format timestamps with `Intl.DateTimeFormat` using the application’s local display convention. Use the entity label supplied by the server; never build labels from untrusted browser input. Keep the active boundary inclusive at exactly five minutes.

- [ ] **Step 3: Implement `recordActivity`**

Mark `src/lib/admin-activity.ts` as server-only. Call `requireProfile()` to derive the current actor, call `createAdminClient()`, and insert only server-built actor fields plus the supplied validated activity input. Catch and `console.error` insert/configuration failures so a successful mutation is not rolled back or reported as failed.

After a successful insert, call `revalidatePath("/admin")` and `revalidatePath("/admin/activity")` so the dashboard preview and full feed reflect the new event on the next render. Do not add a multi-minute cache for activity data.

Export typed records and filters. `getRecentAdminActivity` and `getAdminActivityPage` must use the authenticated server client after `requireProfile("Admin")`; return an error result for unauthorized or query failure instead of exposing raw Supabase errors to the UI. Query newest first, constrain the page size, and use `range()` pagination. Apply filters only from a validated allowlist of actions, entity types, user IDs, division IDs, and ISO date boundaries.

`getAdminUserStatus` must load application users and presence with the authenticated server client, then load Supabase Auth users with the server-only admin client and map `last_sign_in_at` by user ID. If Auth admin configuration or lookup fails, return user rows with `lastSignInAt: null` and an unavailable-state error; do not send service-role data to a Client Component.

- [ ] **Step 4: Run pure tests and typecheck**

Run:

```bash
node --import tsx --test tests/admin-activity-format.test.mjs tests/presence.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit the data layer**

```bash
git add src/lib/activity-format.ts src/lib/presence.ts src/lib/admin-activity.ts tests/admin-activity-format.test.mjs tests/presence.test.mjs
git commit -m "feat: add admin activity data layer"
```

### Task 3: Instrument every supported successful mutation

**Files:**

- Modify: `src/app/actions/equipment.ts:45-160`
- Modify: `src/app/actions/personnel.ts:20-73`
- Modify: `src/app/actions/divisions.ts:13-39`
- Modify: `src/app/actions/equipment-categories.ts:16-38`
- Modify: `src/app/actions/admin.ts:14-95`
- Test: `tests/admin-activity-integration-contract.test.mjs`

**Interfaces:**

- Consumes: `recordActivity(input: ActivityInput)` from Task 2.
- Produces: one activity record after each supported successful mutation.

- [ ] **Step 1: Write the failing instrumentation contract**

Read each action source in `tests/admin-activity-integration-contract.test.mjs`. Require an activity recorder import/call in every supported mutation and assert that validation/error branches occur before the recorder call. Require no recorder call before the mutation result is confirmed successful.

The contract must cover these exact functions:

```js
[
  "addEquipment",
  "updateEquipment",
  "reassignEquipment",
  "retireEquipment",
  "updateEquipmentState",
][("addPersonnel", "updatePersonnel", "deletePersonnel")][
  ("addDivision", "updateDivision")
]["addEquipmentCategory"][
  ("createUser", "updateUser", "deleteUser", "saveCategoryCost")
];
```

Run the test and expect failure.

- [ ] **Step 2: Add minimal readable labels and division context**

For equipment, use the saved category/brand/model fields to build a stable label and query the affected division/name when the action does not already have it. For personnel, division, category, and user actions, use the existing validated input or pre-delete/pre-update record. For assignments, record `assigned` or `reassigned` with the equipment label, division, personnel name, and assignment role in `metadata`.

For user creation/update/delete, never include temporary passwords or auth tokens in activity metadata. For category costs, record the category label and year, never the full credential/configuration payload.

- [ ] **Step 3: Add recorder calls after successful writes**

Use this pattern in each action, with the exact action-specific values and the ID returned by the mutation:

```ts
if (error) return { error: error.message };
await recordActivity({
  action: "created",
  entityType: "personnel",
  entityId: saved.id,
  entityLabel: parsed.data.full_name,
  divisionId: parsed.data.division_id,
});
revalidatePath("/personnel");
return { success: true };
```

For insert APIs that do not currently return IDs, add `.select("id,...").single()` or use the RPC-returned ID so the activity row can identify the affected record. Preserve current error messages, cache invalidation, and return shapes.

- [ ] **Step 4: Run the instrumentation contract and existing tests**

Run:

```bash
node --import tsx --test tests/admin-activity-integration-contract.test.mjs tests/*.test.mjs
```

Expected: PASS with no failed-mutation activity assertions.

- [ ] **Step 5: Commit mutation instrumentation**

```bash
git add src/app/actions/equipment.ts src/app/actions/personnel.ts src/app/actions/divisions.ts src/app/actions/equipment-categories.ts src/app/actions/admin.ts tests/admin-activity-integration-contract.test.mjs
git commit -m "feat: record successful admin mutations"
```

### Task 4: Add the five-minute presence heartbeat

**Files:**

- Create: `src/app/actions/presence.ts`
- Create: `src/components/presence/presence-heartbeat.tsx`
- Modify: `src/app/(dashboard)/layout.tsx:5-23`
- Test: `tests/presence.test.mjs`

**Interfaces:**

```ts
export async function touchPresence(): Promise<
  { success: true } | { error: string }
>;
```

- [ ] **Step 1: Write the failing heartbeat contract**

Extend `tests/presence.test.mjs` to require:

```js
assert.match(actionSource, /requireProfile\(\)/);
assert.match(actionSource, /user_presence/);
assert.match(componentSource, /visibilitychange/);
assert.match(componentSource, /setInterval/);
assert.match(componentSource, /60000/);
```

Run and expect failure.

- [ ] **Step 2: Implement the server action**

`touchPresence()` must accept no user ID and no timestamp. It calls `requireProfile()`, obtains `createAdminClient()`, and upserts `{ user_id: access.profile.id, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() }`. Return a generic error string for missing configuration or failed writes.

- [ ] **Step 3: Implement the visible-page client heartbeat**

On mount, call `touchPresence()` once. Set a 60-second interval only when `document.visibilityState === "visible"`; listen for `visibilitychange` to resume immediately when visible and clear the interval while hidden. Keep failures non-blocking and clean up the interval/listener on unmount. Render nothing.

- [ ] **Step 4: Mount it in the dashboard layout**

Render `<PresenceHeartbeat />` once inside `src/app/(dashboard)/layout.tsx` so every authenticated PULSE page reports presence without adding heartbeats to the Admin page only.

- [ ] **Step 5: Run presence tests and typecheck**

Run:

```bash
node --import tsx --test tests/presence.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit presence**

```bash
git add src/app/actions/presence.ts src/components/presence/presence-heartbeat.tsx src/app/'(dashboard)'/layout.tsx tests/presence.test.mjs
git commit -m "feat: track active PULSE users"
```

### Task 5: Build the Admin activity page and status view

**Files:**

- Create: `src/components/admin/admin-activity.tsx`
- Create: `src/components/admin/activity-retry.tsx`
- Create: `src/app/(dashboard)/admin/activity/page.tsx`
- Create: `src/app/(dashboard)/admin/activity/loading.tsx`
- Modify: `src/components/layout/sidebar.tsx:6-40`
- Modify: `src/app/(dashboard)/layout.tsx:5-23`
- Test: `tests/admin-activity-security.test.mjs`

**Interfaces:**

- Consumes: `getAdminActivityPage(filters)`, `getAdminUserStatus()`, `formatActivityMessage()`, `isActiveNow()`.
- Produces: Admin-only `/admin/activity` route with global filters and status.

- [ ] **Step 1: Write the failing route/security contract**

Require the page source to check `profile?.role !== "Admin"` and redirect to `/`. Require the page to call both Admin data functions. Require the sidebar to receive an Admin visibility value rather than rendering the activity link for every role.

Run and expect failure.

- [ ] **Step 2: Implement the server page and loading state**

Use the App Router page signature with `searchParams: Promise<Record<string, string | string[] | undefined>>`. Normalize user/action/entity/division/date/page query values before calling the typed data functions. Keep activity and status results independent so one failed query renders its own inline error while the other section remains usable.

The page must redirect non-Admins before loading global data. Keep activity queries dynamic and uncached; activity and presence are live administrative data and must not be served from the existing five-minute reference-data caches.

`loading.tsx` should use the existing `PageHeader`, `SectionPanel`, and skeleton styling patterns to reserve the status and timeline layout.

- [ ] **Step 3: Implement the status section**

Show every application user with name/email, role, division scope, a green Active now indicator when `isActiveNow` is true, otherwise `Last seen` relative time, and exact `Last sign in` local timestamp. Show `Unavailable` when Auth lookup failed or no sign-in timestamp exists. Use accessible status text in addition to color.

- [ ] **Step 4: Implement the activity section**

Render a newest-first timeline with actor, `formatActivityMessage()` output, division, and timestamp. Add GET filters for user, action/module, division, and date range. Preserve selected values in the filter controls. Add pagination or Load more using the `page` query parameter and a bounded page size. Add accessible empty and retry states; `src/components/admin/activity-retry.tsx` is the small Client Component that calls `router.refresh()`.

- [ ] **Step 5: Add role-aware navigation**

Make the dashboard layout obtain the current profile once and pass `isAdmin` to `Sidebar`. Keep existing Admin / Users behavior and add an Admin Activity link only when `isAdmin` is true. Add an equivalent Admin link to mobile navigation without exposing activity to Viewers. Keep the route-level redirect and RLS as the real security boundaries.

- [ ] **Step 6: Run route contract, typecheck, and build**

Run:

```bash
node --import tsx --test tests/admin-activity-security.test.mjs
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit the Admin page**

```bash
git add src/components/admin/admin-activity.tsx src/components/admin/activity-retry.tsx src/app/'(dashboard)'/admin/activity src/components/layout/sidebar.tsx src/app/'(dashboard)'/layout.tsx tests/admin-activity-security.test.mjs
git commit -m "feat: add global admin activity page"
```

### Task 6: Add the Admin dashboard preview

**Files:**

- Modify: `src/app/(dashboard)/admin/page.tsx:8-28`
- Modify: `src/components/admin/admin-activity.tsx`
- Test: `tests/admin-activity-security.test.mjs`

**Interfaces:**

- Consumes: `getRecentAdminActivity(5)` and `formatActivityMessage()`.
- Produces: five-event Recent Activity card with `/admin/activity` link.

- [ ] **Step 1: Add the failing preview contract**

Require the Admin page source to call `getRecentAdminActivity` and contain the strings `Recent Activity` and `/admin/activity`. Run the contract test and expect failure.

- [ ] **Step 2: Render the preview**

Load the five newest events in parallel with any existing Admin data. Render the card below access management with actor/action/entity/time, a useful empty state, and a retry state that does not hide user management. Link to the full activity page.

- [ ] **Step 3: Verify the preview**

Run:

```bash
node --import tsx --test tests/admin-activity-security.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit the preview**

```bash
git add src/app/'(dashboard)'/admin/page.tsx src/components/admin/admin-activity.tsx tests/admin-activity-security.test.mjs
git commit -m "feat: show recent admin activity preview"
```

### Task 7: Complete verification and deploy the migration

**Files:**

- Modify: `tests/performance-contract.test.mjs`
- Modify: the generated Supabase migration only if advisor/verification findings require a safe correction.

**Interfaces:**

- Verifies all interfaces from Tasks 1–6 without changing user-facing scope.

- [ ] **Step 1: Add performance/security regression assertions**

Require existing notification/profile caching contracts to remain present. Assert that activity reads are not wrapped in `unstable_cache` with a multi-minute revalidation. Assert that `last_sign_in_at` is accessed only from server-side code and that no component imports `createAdminClient`.

- [ ] **Step 2: Run the complete local suite**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run verify:pulse
npm run verify:migration
npm run build
```

Expected: all commands pass.

- [ ] **Step 3: Review Supabase advisors and migration state**

Use the installed CLI’s discovered advisor and migration commands. Confirm:

- RLS is enabled on both tables.
- `authenticated` has only the intended read grants.
- Admin policies use `private.current_user_role()`.
- No service-role key is bundled into client output.
- Activity indexes exist and the migration is applied to the linked project.

Run a read-only verification query as Admin and Viewer to confirm global Admin visibility and Viewer denial. Do not expose test credentials or service keys in output.

- [ ] **Step 4: Perform a manual acceptance pass**

With an Admin account:

- Add equipment and confirm the activity entry names the actor, equipment, division, and timestamp.
- Update personnel and confirm the update appears.
- Open `/admin/activity` and verify Active now, Last seen, and Last Sign In.
- Leave a tab hidden for more than five minutes and confirm it is no longer Active now.
- Use each filter and pagination control.
- Trigger an activity query failure and confirm the activity error does not hide user status.

With a Viewer account:

- Confirm Admin navigation is absent.
- Navigate directly to `/admin/activity` and confirm redirect.
- Confirm direct Supabase reads of `activity_log` and `user_presence` are denied.

- [ ] **Step 5: Commit final verification updates**

```bash
git add tests/performance-contract.test.mjs supabase/migrations src
git commit -m "test: verify admin activity and presence"
```

## Handoff

After the plan is approved, execute it using either `superpowers:subagent-driven-development` or `superpowers:executing-plans`, with a review checkpoint after each task commit. Read the current Next.js guides for App Router pages, server actions, data fetching, and error handling immediately before implementation; use the repository’s installed Next.js 16.3.4 documentation rather than older examples.
