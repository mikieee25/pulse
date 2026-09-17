# PULSE Performance and UX Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PULSE faster and more responsive by replacing unbounded equipment reads with indexed aggregates and server pagination, then add streaming, client navigation, and safe browser caching without weakening authorization or data freshness.

**Architecture:** Keep authenticated routes dynamically server-rendered. Use Postgres indexes and typed Supabase RPCs to aggregate and paginate near the data, a server-only query facade to enforce scope and normalize errors, `unstable_cache` only for safe role/scope-keyed reference and aggregate results, and Suspense/Next Link transitions for progressive rendering. Do not add an ORM or cache activity, presence, permissions, or authenticated HTML.

**Tech Stack:** Next.js 16.3.4 App Router, React 19, TypeScript, Supabase/Postgres/RLS, Supabase JS, Zod, Tailwind CSS v4, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-17-pulse-performance-and-ux-design.md`

## Global constraints

- Preserve the uncommitted login/last-seen changes in `src/app/auth/login/route.ts`, `src/components/changelog/changelog.tsx`, and `tests/presence.test.mjs`.
- Never stage or commit `(New) EUMB ICT SEMI-EX SERIAL NOs.xlsx`.
- Preserve Viewer division scoping and Admin all-division access.
- Preserve the current lifecycle precedence and card semantics.
- Do not cache admin activity, presence, authorization results, or authenticated HTML.
- Do not add Prisma, Drizzle, React Query, Redis, or another data/cache layer.
- Keep every equipment/report page at 25 rows by default and 50 rows maximum.
- Use the installed Next.js 16 documentation under `node_modules/next/dist/docs/` before changing cache, streaming, or navigation behavior.
- Update the in-app changelog before the final implementation commit.

---

## Task 1: Lock lifecycle parity and query-size contracts

**Files:**

- Create: `tests/inventory-read-model.test.mjs`

**Interfaces:**

```ts
type EffectiveStatusFixture = {
  storedStatus: "Active" | "For Replacement" | "Retired";
  conditionState: string | null;
  lifespanYears: number | null;
  yearAcquired: number | null;
  asOf: string;
  expected:
    "Active" | "Expiring soon" | "For Replacement" | "Broken" | "Retired";
};
```

- [ ] **Step 1: Add shared lifecycle fixtures**

Create fixtures covering Retired precedence, Broken precedence, manual replacement, expired lifecycle, one-year expiry boundary, missing year, and normal Active. Exercise `equipmentDisplayStatus` against every fixture.

- [ ] **Step 2: Add failing SQL contract assertions**

Require the CLI-generated migration `supabase/migrations/20260917000234_optimize_inventory_read_paths.sql` to contain:

- `pulse_effective_equipment_status`
- indexes for equipment category/division/assignee/custodian and assignment-history equipment/time
- `pulse_inventory_dashboard`
- `pulse_inventory_plan`
- `pulse_search_equipment`
- `pulse_personnel_summary`
- `pulse_search_personnel`
- `pulse_division_summary`
- `pulse_notification_snapshot`
- RLS-safe/security/grant declarations

Run:

```powershell
node --import tsx --test tests/inventory-read-model.test.mjs
```

Expected: FAIL because the migration and query facade do not exist.

- [ ] **Step 3: Keep the red test uncommitted until Task 2 makes it green**

Do not weaken the assertions to match the current implementation.

## Task 2: Add indexes, lifecycle SQL, and bounded read RPCs

**Files:**

- Create: `supabase/migrations/20260917000234_optimize_inventory_read_paths.sql`
- Test: `tests/inventory-read-model.test.mjs`

**Database interfaces:**

```sql
public.pulse_effective_equipment_status(
  p_status equipment_status,
  p_condition text,
  p_lifespan_years integer,
  p_year_acquired integer,
  p_as_of date
) returns text

public.pulse_inventory_dashboard(
  p_division_scope uuid,
  p_as_of date
) returns jsonb

public.pulse_inventory_plan(
  p_division_scope uuid,
  p_year integer,
  p_mode text
) returns table (
  division_code text,
  category_id uuid,
  category_name text,
  unit_count bigint,
  unit_cost numeric,
  subtotal numeric
)

public.pulse_search_equipment(
  p_query text,
  p_category text,
  p_division text,
  p_brand text,
  p_status text,
  p_assignment text,
  p_page integer,
  p_page_size integer
) returns table (
  id uuid,
  category_name text,
  lifespan_years integer,
  model text,
  brand text,
  serial_number text,
  year_acquired integer,
  status equipment_status,
  condition_state text,
  division_code text,
  custodian_name text,
  assignee_name text,
  display_status text,
  total_count bigint
)

public.pulse_notification_snapshot(
  p_division_scope uuid,
  p_as_of date
) returns jsonb

public.pulse_personnel_summary() returns jsonb

public.pulse_search_personnel(
  p_query text,
  p_division text,
  p_status text,
  p_assignment text,
  p_page integer,
  p_page_size integer
) returns table (
  id uuid,
  full_name text,
  initials text,
  position text,
  plantilla_status plantilla_status,
  division_id uuid,
  division_code text,
  equipment_count bigint,
  total_count bigint
)

public.pulse_division_summary(p_as_of date) returns table (
  id uuid,
  code text,
  full_name text,
  personnel_count bigint,
  equipment_count bigint,
  replacement_count bigint
)
```

- [ ] **Step 1: Add only query-matched indexes**

Create normal B-tree indexes:

```sql
create index equipment_category_id_idx on public.equipment (category_id);
create index equipment_division_id_idx on public.equipment (division_id);
create index equipment_assigned_to_idx on public.equipment (assigned_to) where assigned_to is not null;
create index equipment_assignee_id_idx on public.equipment (assignee_id) where assignee_id is not null;
create index equipment_created_at_idx on public.equipment (created_at desc);
create index personnel_division_id_idx on public.personnel (division_id);
create index assignment_history_equipment_time_idx on public.assignment_history (equipment_id, assigned_at desc);
create index assignment_history_personnel_id_idx on public.assignment_history (personnel_id);
```

Do not add another category-cost index because the unique `(category_id, year)` constraint already provides one. Use `if not exists` so replay is safe.

- [ ] **Step 2: Implement SQL lifecycle parity**

Implement `pulse_effective_equipment_status` as `immutable`, pass `p_as_of` explicitly, and mirror the TypeScript precedence exactly. Do not call `current_date` inside this helper.

- [ ] **Step 3: Implement compact aggregate RPCs**

`pulse_inventory_dashboard` returns:

```json
{
  "metrics": {
    "total": 0,
    "active": 0,
    "replacement": 0,
    "expiring": 0,
    "broken": 0
  },
  "statusCounts": [],
  "divisionCounts": [],
  "replacementMatrix": []
}
```

`pulse_inventory_plan` supports only `replacement` and `acquired`, chooses the newest category rate with `year <= p_year`, and groups by division/category in SQL.

`pulse_notification_snapshot` returns replacement, expiring, and unassigned counts plus no more than five recent assignment records. It must not return all equipment IDs.

`pulse_personnel_summary`, `pulse_search_personnel`, and `pulse_division_summary` return counts and bounded rows without embedding equipment arrays. Personnel search is clamped to 50 rows and both personnel/division functions run as `security invoker` so Viewer RLS remains effective.

- [ ] **Step 4: Implement RLS-aware bounded search**

Make `pulse_search_equipment` `security invoker`, clamp `p_page_size` to `1..50`, clamp page to at least 1, apply the same validated filters as `parseEquipmentFilters`, order by `created_at desc, id`, and return `count(*) over()` as `total_count`. Grant execution only to `authenticated`.

Aggregate functions are called through the server-only service client with a scope derived from the authenticated profile. Revoke aggregate execution from `anon` and `authenticated`; service role remains the only caller. Set a fixed `search_path` on every function.

- [ ] **Step 5: Run SQL/security contracts**

```powershell
node --import tsx --test tests/inventory-read-model.test.mjs tests/admin-activity-security.test.mjs
npx supabase db lint --linked
npx supabase db push --linked --dry-run
```

Expected: tests and lint PASS; dry run lists only the new migration.

- [ ] **Step 6: Apply and verify the migration**

After reviewing the dry run:

```powershell
npx supabase db push --linked
npx supabase migration list --linked
```

Verify 1,000 equipment records remain and all seven RPCs return bounded results. Do not alter data.

- [ ] **Step 7: Commit the database read model**

```powershell
git add supabase/migrations/20260917000234_optimize_inventory_read_paths.sql tests/inventory-read-model.test.mjs
git commit -m "perf(db): add indexed inventory read models"
```

## Task 3: Generate Supabase types and build the server query facade

**Files:**

- Create: `src/types/database.ts`
- Create: `src/lib/inventory-queries.ts`
- Modify: `src/utils/supabase/server.ts`
- Modify: `src/utils/supabase/admin.ts`
- Modify: `src/lib/cache-tags.ts`
- Modify: `src/lib/cached-data.ts`
- Modify: `tests/performance-contract.test.mjs`
- Create: `tests/inventory-query-boundaries.test.mjs`

**TypeScript interfaces:**

```ts
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 50;

export type InventoryScope = { role: AppRole; divisionScope: string | null };
export type InventoryPage<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  error: string | null;
};

export async function getDashboardSnapshot(
  asOf?: Date
): Promise<DashboardSnapshotResult>;
export async function getPlanningSnapshot(
  year: number,
  mode: "replacement" | "acquired"
): Promise<PlanningSnapshotResult>;
export async function getEquipmentPage(
  filters: EquipmentFilters & { category: string }
): Promise<InventoryPage<EquipmentData>>;
export async function getReportPage(
  filters: ReportFilters
): Promise<ReportPageResult>;
export async function getPersonnelSummary(): Promise<PersonnelSummaryResult>;
export async function getPersonnelPage(
  filters: PersonnelFilters
): Promise<InventoryPage<PersonnelData>>;
export async function getDivisionSummary(
  asOf?: Date
): Promise<DivisionSummaryResult>;
export async function getNotificationSnapshot(): Promise<NotificationSnapshotResult>;
```

- [ ] **Step 1: Generate the linked database types**

```powershell
New-Item -ItemType Directory -Force src/types | Out-Null
npx supabase gen types typescript --linked --schema public | Set-Content -Encoding utf8 src/types/database.ts
```

Pass `Database` to the Supabase server and admin client factories. Resolve resulting query type errors rather than adding `any` or broad casts.

- [ ] **Step 2: Implement the facade and validation**

Mark `inventory-queries.ts` as `server-only`. Parse filters and RPC responses with narrow TypeScript/Zod schemas. `getEquipmentPage` and `getReportPage` use the authenticated client so RLS applies. Aggregate methods derive role/scope from `getCurrentProfile`; never accept role/scope from browser input.

Before implementation, create `tests/inventory-query-boundaries.test.mjs` with failing assertions for the facade exports, `DEFAULT_PAGE_SIZE = 25`, `MAX_PAGE_SIZE = 50`, and the absence of unrestricted page-size forwarding. Run it once and confirm it fails because the facade is absent, then implement the facade.

- [ ] **Step 3: Cache only compact aggregates**

Add cache tags:

```ts
inventory: "pulse:inventory";
planning: "pulse:planning";
```

Cache Dashboard and planning snapshots for 30 seconds with role, division scope, date/year, and mode in the function arguments. Replace notification equipment-array caching with the compact snapshot at 30 seconds. Leave search pages, activity, presence, and profile authorization uncached.

- [ ] **Step 4: Avoid Viewer-only management reads**

Do not call `getCachedPersonnel` when `profile.role !== "Admin"`. Return an empty management-options list to Viewer pages while keeping normal read-only personnel pages unchanged.

- [ ] **Step 5: Add a read-only performance verifier**

Create `scripts/verify-performance.ts` and add:

```json
"verify:performance": "tsx scripts/verify-performance.ts"
```

The script must call the RPCs without mutating data and assert:

- Dashboard payload is below 100 KB.
- Notification activity rows are at most five.
- Equipment search returns at most 50 rows.
- Personnel search returns at most 50 rows.
- Search total equals the current scoped equipment count.
- Lifecycle fixture outputs match TypeScript.

Never print keys, tokens, or complete inventory records.

- [ ] **Step 6: Run and commit the facade**

```powershell
npm run typecheck
npm run verify:performance
node --import tsx --test tests/performance-contract.test.mjs tests/inventory-query-boundaries.test.mjs
```

Commit:

```powershell
git add package.json src/types/database.ts src/utils/supabase/server.ts src/utils/supabase/admin.ts src/lib/cache-tags.ts src/lib/cached-data.ts src/lib/inventory-queries.ts scripts/verify-performance.ts tests/performance-contract.test.mjs tests/inventory-query-boundaries.test.mjs
git commit -m "perf(data): add typed bounded inventory queries"
```

## Task 4: Migrate Dashboard, Budget, Summary, and notifications

**Files:**

- Modify: `src/app/(dashboard)/page.tsx`
- Modify: `src/app/(dashboard)/budget/page.tsx`
- Modify: `src/app/(dashboard)/summary/page.tsx`
- Modify: `src/components/layout/topbar.tsx`
- Modify: `src/lib/notifications.ts`
- Modify: `src/app/actions/equipment.ts`
- Modify: `src/app/actions/equipment-categories.ts`
- Modify: `src/app/actions/admin.ts`
- Modify: `src/app/actions/personnel.ts`
- Modify: `src/app/actions/divisions.ts`
- Test: `tests/performance-contract.test.mjs`
- Test: `tests/live-notifications.test.mjs`
- Test: `tests/budget-page-ui.test.mjs`

- [ ] **Step 1: Write failing page-source contracts**

Require all four consumers to import the facade and prohibit direct full equipment reads. Require the Topbar to receive compact notification items/counts rather than `NotificationEquipment[]`.

- [ ] **Step 2: Replace Dashboard aggregation**

Render cards, charts, and replacement matrix directly from `getDashboardSnapshot()`. Preserve the existing labels and `Active = Active + Expiring + For Replacement`, excluding Broken and Retired.

- [ ] **Step 3: Replace Budget and Summary aggregation**

Use `getPlanningSnapshot(year, mode)`. Preserve fiscal-year selection, latest applicable cost, Admin rate editor, export shape, and every category/division row including zero totals where the UI expects them.

- [ ] **Step 4: Replace notification construction**

Change `buildNotifications` to consume aggregate counts and recent events. Generate stable IDs from kind plus count/as-of timestamp rather than concatenating every equipment ID. Keep read-state behavior and links unchanged.

- [ ] **Step 5: Complete invalidation coverage**

Every successful equipment mutation invalidates `inventory`, `planning`, and `notifications`. Category/cost/division/personnel mutations invalidate only tags whose output they affect. Keep `revalidatePath` for the mutation's current route; do not use blanket root revalidation as a cache substitute.

- [ ] **Step 6: Verify and commit**

```powershell
node --import tsx --test tests/performance-contract.test.mjs tests/live-notifications.test.mjs tests/budget-page-ui.test.mjs tests/equipment-status.test.mjs
npm run typecheck
npm run lint
```

Commit:

```powershell
git add 'src/app/(dashboard)/page.tsx' 'src/app/(dashboard)/budget/page.tsx' 'src/app/(dashboard)/summary/page.tsx' src/components/layout/topbar.tsx src/lib/notifications.ts src/app/actions/equipment.ts src/app/actions/equipment-categories.ts src/app/actions/admin.ts src/app/actions/personnel.ts src/app/actions/divisions.ts src/lib/cache-tags.ts tests/performance-contract.test.mjs tests/live-notifications.test.mjs tests/budget-page-ui.test.mjs
git commit -m "perf(dashboard): serve compact inventory aggregates"
```

## Task 5: Move Equipment filtering and pagination to the server

**Files:**

- Modify: `src/app/(dashboard)/equipment/page.tsx`
- Modify: `src/components/equipment/equipment-table.tsx`
- Create: `src/components/equipment/equipment-filter-bar.tsx`
- Modify: `src/components/equipment/columns.tsx`
- Modify: `src/lib/equipment-filters.ts`
- Modify: `tests/equipment-filters.test.mjs`
- Test: `tests/inventory-query-boundaries.test.mjs`

- [ ] **Step 1: Extend filter parsing tests**

Add page-size parsing with default 25 and maximum 50. Confirm invalid pages, statuses, assignments, and page sizes fall back safely. Confirm query serialization preserves category and removes default values.

- [ ] **Step 2: Fetch only the requested page**

Replace the direct category query with `getEquipmentPage`. The page passes `rows`, `total`, `page`, and `pageSize` to the table. Compute cards from the scoped category aggregate supplied by the facade, not only the visible page.

- [ ] **Step 3: Make filters URL-driven**

`equipment-filter-bar.tsx` uses `useRouter`, `usePathname`, `useSearchParams`, and `useTransition`. Text search waits 250 ms before `router.replace`; selects update immediately; every filter change resets page to 1. Show an accessible `Updating equipment…` status during transition.

- [ ] **Step 4: Make pagination server-driven**

Remove TanStack client pagination and filtering. Keep sorting only if it is sent as a validated RPC parameter; otherwise use the deterministic server order. Previous/Next links update `page` in the URL and retain all filters.

- [ ] **Step 5: Use client navigation for categories**

Replace raw `<a>` category tabs with `next/link`. Preserve active styles and query state, reset page to 1, and ensure the route loading skeleton can be prefetched.

- [ ] **Step 6: Verify and commit**

```powershell
node --import tsx --test tests/equipment-filters.test.mjs tests/inventory-query-boundaries.test.mjs tests/equipment-category-coverage.test.mjs
npm run typecheck
npm run lint
```

Commit:

```powershell
git add 'src/app/(dashboard)/equipment/page.tsx' src/components/equipment/equipment-table.tsx src/components/equipment/equipment-filter-bar.tsx src/components/equipment/columns.tsx src/lib/equipment-filters.ts tests/equipment-filters.test.mjs tests/inventory-query-boundaries.test.mjs
git commit -m "perf(equipment): add server filtering and pagination"
```

## Task 6: Move Reports pagination/export to the server

**Files:**

- Modify: `src/app/(dashboard)/reports/page.tsx`
- Modify: `src/app/(dashboard)/reports/reports-client.tsx`
- Create: `src/app/(dashboard)/reports/export/route.ts`
- Create: `src/lib/csv.ts`
- Create: `tests/report-pagination-export.test.mjs`
- Test: `tests/inventory-query-boundaries.test.mjs`

- [ ] **Step 1: Add failing report contracts**

Require URL-driven report filters, a bounded `getReportPage` call, a protected export route, escaped CSV fields, UTF-8 BOM, and `Cache-Control: private, no-store`.

- [ ] **Step 2: Replace client-side full-table filtering**

Parse report filters on the server and pass only one page plus aggregate metrics/facets to `ReportsClient`. Reuse the Equipment filter transition behavior and keep tabs URL-addressable.

- [ ] **Step 3: Implement protected streaming CSV**

The route authenticates with `requireProfile`, validates the same filters, fetches rows in batches of 500 until complete, and returns a `ReadableStream` CSV response. It must apply the same RLS/scope and effective status logic as the table. Set a safe filename and no-store headers.

- [ ] **Step 4: Verify and commit**

```powershell
node --import tsx --test tests/report-pagination-export.test.mjs tests/inventory-query-boundaries.test.mjs
npm run typecheck
npm run lint
```

Commit:

```powershell
git add 'src/app/(dashboard)/reports/page.tsx' 'src/app/(dashboard)/reports/reports-client.tsx' 'src/app/(dashboard)/reports/export/route.ts' src/lib/csv.ts tests/report-pagination-export.test.mjs tests/inventory-query-boundaries.test.mjs
git commit -m "perf(reports): paginate and stream inventory exports"
```

## Task 7: Bound Personnel and Division directory reads

**Files:**

- Modify: `src/app/(dashboard)/personnel/page.tsx`
- Modify: `src/components/personnel/personnel-table.tsx`
- Create: `src/components/personnel/personnel-filter-bar.tsx`
- Create: `src/lib/personnel-filters.ts`
- Modify: `src/app/(dashboard)/divisions/page.tsx`
- Create: `tests/personnel-division-performance.test.mjs`

- [ ] **Step 1: Add failing directory contracts**

Require Personnel to call `getPersonnelSummary` and `getPersonnelPage`, Divisions to call `getDivisionSummary`, and both pages to avoid nested equipment array reads. Require Personnel pages to clamp at 50 rows and retain filter/page state in the URL.

- [ ] **Step 2: Move Personnel counts and pagination to SQL**

Render the four Personnel cards from the compact summary. Render only the requested directory page. Reuse the URL-driven filter/transition pattern from Equipment for name, division, employment status, and assignment state. Keep Admin edit/delete controls and Viewer read-only behavior unchanged.

- [ ] **Step 3: Replace Division nested equipment reads**

Render the Divisions table and KPI totals from `getDivisionSummary`. Preserve replacement semantics by using `pulse_effective_equipment_status` in SQL; do not fetch equipment rows into the page.

- [ ] **Step 4: Verify and commit**

```powershell
node --import tsx --test tests/personnel-division-performance.test.mjs tests/personnel-classification.test.mjs
npm run typecheck
npm run lint
```

Commit:

```powershell
git add 'src/app/(dashboard)/personnel/page.tsx' src/components/personnel/personnel-table.tsx src/components/personnel/personnel-filter-bar.tsx src/lib/personnel-filters.ts 'src/app/(dashboard)/divisions/page.tsx' tests/personnel-division-performance.test.mjs
git commit -m "perf(directory): bound personnel and division reads"
```

## Task 8: Add granular streaming and reduce initial client work

**Files:**

- Create: `src/components/layout/panel-skeleton.tsx`
- Create: `src/app/(dashboard)/dashboard-content.tsx`
- Create: `src/components/dashboard/dashboard-charts-lazy.tsx`
- Modify: `src/app/(dashboard)/page.tsx`
- Modify: `src/app/(dashboard)/loading.tsx`
- Create: `src/app/(dashboard)/equipment/loading.tsx`
- Create: `src/app/(dashboard)/reports/loading.tsx`
- Create: `src/app/(dashboard)/budget/loading.tsx`
- Create: `tests/streaming-navigation.test.mjs`

- [ ] **Step 1: Add failing streaming/navigation tests**

Require page-level loading files for the slow list/planning routes, sibling Suspense boundaries on Dashboard, and Next Link category navigation. Assert skeletons include accessible labels and geometry matching cards/table panels.

- [ ] **Step 2: Split the Dashboard into independent async panels**

Render `PageHeader` synchronously. Put metrics, charts, and replacement table behind sibling `<Suspense>` boundaries so one slow section does not block the others. Share the same cached snapshot promise to avoid duplicate RPC calls.

- [ ] **Step 3: Lazy-load charts**

Load the Recharts-dependent client module through a small client wrapper using `next/dynamic`, with chart-sized skeletons. Keep metric values and table content server-rendered.

- [ ] **Step 4: Add route-specific skeletons**

Equipment and Reports skeletons show a filter row and table rows. Budget shows forecast cards and the replacement grid. Avoid spinners that collapse layout.

- [ ] **Step 5: Verify and commit**

```powershell
node --import tsx --test tests/streaming-navigation.test.mjs tests/dashboard-style-contract.test.mjs
npm run typecheck
npm run lint
npm run build
```

Commit:

```powershell
git add 'src/app/(dashboard)/page.tsx' 'src/app/(dashboard)/dashboard-content.tsx' 'src/app/(dashboard)/loading.tsx' 'src/app/(dashboard)/equipment/loading.tsx' 'src/app/(dashboard)/reports/loading.tsx' 'src/app/(dashboard)/budget/loading.tsx' src/components/dashboard/dashboard-charts-lazy.tsx src/components/layout/panel-skeleton.tsx tests/streaming-navigation.test.mjs
git commit -m "perf(ui): stream dashboard and list loading states"
```

## Task 9: Add safe public-asset browser caching and production measurements

**Files:**

- Modify: `next.config.ts`
- Modify: `package.json`
- Create: `tests/cache-header-contract.test.mjs`
- Modify: `scripts/verify-performance.ts`

- [ ] **Step 1: Add failing header contracts**

Require explicit headers for `/pulseicon.svg`, `/pulselogo.svg`, `/pulselogo-dark-text.svg`, `/DOE LOGO OFFICIAL PNG.png`, and `/Bagong Pilipinas.png`:

```text
Cache-Control: public, max-age=86400, stale-while-revalidate=604800
```

Assert no authenticated route receives a public cache header.

- [ ] **Step 2: Implement only public-asset headers**

Add `headers()` to `next.config.ts` for those exact paths. Do not apply a wildcard to pages or `/_next`; Next already manages fingerprinted assets.

- [ ] **Step 3: Record a repeatable production baseline**

Extend `verify:performance` to print compact timing and payload summaries for the read RPCs. Add a documented manual production pass for Dashboard, Equipment, Reports, and Budget using browser DevTools/Lighthouse on desktop and mobile. Record LCP, INP, CLS, transferred bytes, and RPC duration in the implementation PR/commit notes, not in runtime UI.

- [ ] **Step 4: Verify headers and commit**

```powershell
node --import tsx --test tests/cache-header-contract.test.mjs
npm run build
npm run start
```

In a second terminal:

```powershell
curl.exe -I http://localhost:3000/pulseicon.svg
curl.exe -I http://localhost:3000/login
```

Expected: icon has the one-day public header; login remains private/no-store.

Commit:

```powershell
git add next.config.ts package.json scripts/verify-performance.ts tests/cache-header-contract.test.mjs
git commit -m "perf(web): tune public asset caching"
```

## Task 10: Final regression, changelog, and rollout

### Current execution status (2026-09-17)

Implemented in the workspace: indexed/aggregate inventory RPCs, tagged aggregate caching, server-bounded Equipment/Personnel/Reports reads, protected batched CSV export, URL-aware Equipment search transitions, route loading states and lazy charts, public asset cache headers, shared 10/25/50 rows-per-page controls (25 default), performance verification, activity/presence freshness safeguards, and changelog coverage. A generated database type artifact is present, but strict generic binding is deferred because existing nullable mutation payloads require a separate compatibility pass. Production Web Vitals still require a browser-side measurement pass after deployment; no deployment or commit is performed by this implementation turn.

**Files:**

- Modify: `src/components/changelog/changelog.tsx`
- Modify: `docs/superpowers/plans/2026-09-17-pulse-performance-and-ux.md` only to check completed boxes during execution

- [ ] **Step 1: Update the in-app changelog before the final commit**

Add one release entry covering indexed inventory reads, compact aggregates, server pagination/export, streaming panels, and safe browser caching. Do not claim measured improvements until the production measurements exist.

- [ ] **Step 2: Run the full local gate**

```powershell
npm test
npm run typecheck
npm run lint
npm run verify:pulse
npm run verify:migration
npm run verify:performance
npm run build
git diff --check
```

Expected: all commands PASS. Confirm the build still marks authenticated routes dynamic.

- [ ] **Step 3: Run Supabase verification**

```powershell
npx supabase db lint --linked
npx supabase migration list --linked
```

Confirm local/remote migration parity, 1,000 equipment rows, Viewer division isolation, Admin all-division totals, list page limit 50, notification event limit five, and unchanged activity/presence behavior.

- [ ] **Step 4: Review security and scope**

Confirm:

- no service-role value reaches client bundles or logs;
- service-only aggregate RPCs cannot be executed by `anon` or `authenticated`;
- search/export use authenticated RLS;
- no user-specific data receives public browser/CDN caching;
- no `any`, skipped error, or unbounded equipment query was introduced.

- [ ] **Step 5: Commit documentation and changelog**

```powershell
git add src/components/changelog/changelog.tsx docs/superpowers/specs/2026-09-17-pulse-performance-and-ux-design.md docs/superpowers/plans/2026-09-17-pulse-performance-and-ux.md
git commit -m "docs: record PULSE performance optimization"
```

- [ ] **Step 6: Deploy in order**

1. Push the Supabase migration.
2. Deploy a Vercel Preview.
3. Verify Admin and Viewer accounts, Dashboard totals, Equipment/Reports filters, CSV export, notifications, activity, presence, and password flow.
4. Compare production measurements against the baseline.
5. Promote the verified Preview to Production.

- [ ] **Step 7: Post-deployment acceptance**

Accept the rollout only when:

- no page transfers the full equipment dataset;
- aggregate payloads remain below 100 KB;
- paginated responses remain at or below 50 rows;
- totals match pre-migration production totals;
- LCP is below 2.5 seconds, INP below 200 ms, and CLS below 0.1 on representative production checks;
- Admin activity and `Active now`/`Last Seen` remain live and uncached.
