# PULSE Reliability and Persistent Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve PULSE lifecycle correctness, mutation safety, notification usefulness, and Equipment filter continuity.

**Architecture:** Preserve the existing Next.js App Router and Supabase architecture. Use pure domain helpers for lifecycle and URL state, keep filtering client-side, and add pending/error handling directly to existing mutation components except for the server-rendered budget form, which gets one focused client component.

**Tech Stack:** Next.js 16.3.4 App Router, React 19.2.8, TypeScript, Supabase SSR, Zod 4, TanStack Table 8, Node test runner with `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-15-pulse-reliability-and-persistent-filters-design.md`

## Global Constraints

- Preserve existing routes, Admin/Viewer permissions, division-scoped RLS, Supabase schema, and DOE theme.
- Add no npm dependency and no database migration.
- Keep explicit-save behavior; do not introduce autosave for equipment, personnel, division, user, or budget data.
- Treat `equipment_categories.lifespan_years` as authoritative; `null` disables automatic expiry.
- Use the bundled Next.js 16 guidance under `node_modules/next/dist/docs/` for forms and search parameters.
- Run tests through `node --import tsx --test`; plain `node --test` cannot load this repository's TypeScript and path aliases.

---

### Task 1: Establish a reliable project quality gate

**Files:**

- Modify: `package.json:5`
- Modify: `scripts/verify-pulse.ts:4`

**Interfaces:**

- Consumes: existing ESLint, TypeScript, Node tests, verification scripts, and Next.js build commands.
- Produces: `npm test`, `npm run typecheck`, and `npm run check` commands used by every later task.

- [ ] **Step 1: Run the current verifier to capture the regression**

Run:

```bash
npm run verify:pulse
```

Expected: FAIL because its Drone assertion expects `Active` while the shared three-year lifecycle returns `For Replacement`.

- [ ] **Step 2: Correct the stale verification and add package scripts**

Change the Drone expectation in `scripts/verify-pulse.ts` to `For Replacement`. Add these scripts without changing the existing migration/import commands:

```json
"test": "node --import tsx --test tests/*.test.mjs",
"typecheck": "tsc --noEmit",
"check": "npm run lint && npm run typecheck && npm test && npm run verify:pulse && npm run verify:migration && npm run build"
```

- [ ] **Step 3: Run the baseline quality gate**

Run:

```bash
npm run check
```

Expected: lint, TypeScript, 37 or more tests, both verification scripts, and the production build pass.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json scripts/verify-pulse.ts
git commit -m "test: add reliable project quality gate"
```

### Task 2: Make database lifespan values authoritative

**Files:**

- Modify: `src/lib/pulse.ts:57`
- Modify: `src/lib/notifications.ts:16`
- Modify: `src/components/equipment/columns.tsx:9`
- Modify: `src/components/layout/topbar.tsx:14`
- Modify: `src/app/(dashboard)/page.tsx:10`
- Modify: `src/app/(dashboard)/equipment/page.tsx:34`
- Modify: `src/app/(dashboard)/equipment/[id]/page.tsx:16`
- Modify: `src/app/(dashboard)/divisions/page.tsx:27`
- Modify: `src/app/(dashboard)/summary/page.tsx:5`
- Modify: `src/app/(dashboard)/reports/page.tsx:8`
- Modify: `src/app/(dashboard)/reports/reports-client.tsx:11`
- Modify: `src/app/(dashboard)/budget/page.tsx:93`
- Modify: `scripts/verify-pulse.ts:4`
- Test: `tests/equipment-status.test.mjs`
- Test: `tests/live-notifications.test.mjs`

**Interfaces:**

- Consumes: `equipment_categories.lifespan_years: number | null` from Supabase relations.
- Produces: `lifecycleStatus(status, lifespanYears, yearAcquired, today?)`, `equipmentDisplayStatus(status, condition, lifespanYears, yearAcquired, today?)`, `needsReplacement(status, condition, lifespanYears, yearAcquired, today?)`, and `monthsUntilExpiry(lifespanYears, yearAcquired, today?)`.

- [ ] **Step 1: Rewrite lifecycle tests against the final signatures**

Cover automatic expiry, upcoming expiry, manual lifecycle, condition override, and retirement:

```js
assert.equal(
  equipmentDisplayStatus("Active", "Good", 3, 2020, today),
  "For Replacement"
);
assert.equal(
  equipmentDisplayStatus("Active", "Good", 3, 2024, today),
  "Expiring soon"
);
assert.equal(
  equipmentDisplayStatus("Active", "Good", null, 2018, today),
  "Active"
);
assert.equal(
  equipmentDisplayStatus("Active", "Broken", null, 2026, today),
  "Broken"
);
assert.equal(
  equipmentDisplayStatus("Retired", "Broken", 3, 2020, today),
  "Retired"
);
```

Update `InventoryCardRecord` fixtures from `category` to `lifespan_years`.

- [ ] **Step 2: Run domain tests to verify the signature change is red**

Run:

```bash
node --import tsx --test tests/equipment-status.test.mjs tests/live-notifications.test.mjs
```

Expected: FAIL because the production helpers still infer lifespan from category text.

- [ ] **Step 3: Change the pure lifecycle functions**

Implement the lifespan contract in `src/lib/pulse.ts`:

```ts
export type InventoryCardRecord = {
  status: StoredEquipmentStatus;
  condition_state: string | null | undefined;
  lifespan_years: number | null | undefined;
  year_acquired: number | null | undefined;
};

export function lifecycleStatus(
  status: StoredEquipmentStatus,
  lifespanYears: number | null | undefined,
  yearAcquired: number | null | undefined,
  today = new Date()
): LifecycleStatus {
  if (status === "Retired") return status;
  if (!lifespanYears || !yearAcquired) return status;

  const expiry = new Date(yearAcquired + lifespanYears, 0, 1);
  const oneYearFromNow = new Date(
    today.getFullYear() + 1,
    today.getMonth(),
    today.getDate()
  );
  if (expiry <= today) return "For Replacement";
  if (expiry <= oneYearFromNow) return "Expiring soon";
  return "Active";
}
```

Apply the same parameter replacement to `equipmentDisplayStatus`, `needsReplacement`, `inventoryCardStats`, and `monthsUntilExpiry`.

- [ ] **Step 4: Select and pass `lifespan_years` at every caller**

Change every equipment category relation from `equipment_categories(name)` or `equipment_categories(id,name)` to include `lifespan_years`. Update local row types and pass:

```ts
item.equipment_categories?.lifespan_years;
```

Do not derive lifespan from `canonicalEquipmentCategory()`.

- [ ] **Step 5: Update verification and notification fixtures**

Use numeric/null lifespan arguments in `scripts/verify-pulse.ts`. Add `lifespan_years` to every `equipment_categories` fixture in `tests/live-notifications.test.mjs`.

- [ ] **Step 6: Run focused and full checks**

Run:

```bash
node --import tsx --test tests/equipment-status.test.mjs tests/live-notifications.test.mjs
npm run typecheck
npm test
```

Expected: all commands pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/pulse.ts src/lib/notifications.ts src/components/equipment/columns.tsx src/components/layout/topbar.tsx src/app/'(dashboard)'/page.tsx src/app/'(dashboard)'/equipment/page.tsx src/app/'(dashboard)'/equipment/'[id]'/page.tsx src/app/'(dashboard)'/divisions/page.tsx src/app/'(dashboard)'/summary/page.tsx src/app/'(dashboard)'/reports/page.tsx src/app/'(dashboard)'/reports/reports-client.tsx src/app/'(dashboard)'/budget/page.tsx scripts/verify-pulse.ts tests/equipment-status.test.mjs tests/live-notifications.test.mjs
git commit -m "fix: use category lifespan for lifecycle status"
```

### Task 3: Harden category normalization and naming

**Files:**

- Modify: `src/lib/pulse.ts:10`
- Modify: `src/components/equipment/add-equipment-dialog.tsx:8`
- Modify: `tests/equipment-category-coverage.test.mjs`
- Modify: `tests/list-import.test.mjs`

**Interfaces:**

- Consumes: arbitrary administrator/import category labels.
- Produces: `DEFAULT_EQUIPMENT_CATEGORIES` and `canonicalEquipmentCategory(category)` with whole-term alias matching.

- [ ] **Step 1: Add ambiguous and supported alias tests**

Add cases proving valid aliases still map and partial words remain untouched:

```js
assert.equal(canonicalEquipmentCategory("Wireless microphone"), "Microphones");
assert.equal(canonicalEquipmentCategory("Dynamic UPS"), "Dynamic UPS");
assert.equal(
  canonicalEquipmentCategory("Printer / Scanner"),
  "Printers & Scanners"
);
assert.equal(canonicalEquipmentCategory("Tablet Pen"), "Tablet Accessories");
```

Add a source-contract assertion that the fallback constant is named `DEFAULT_EQUIPMENT_CATEGORIES`.

- [ ] **Step 2: Run category tests to verify they fail**

Run:

```bash
node --import tsx --test tests/equipment-category-coverage.test.mjs tests/list-import.test.mjs
```

Expected: FAIL because `Dynamic UPS` currently contains the substring `mic`.

- [ ] **Step 3: Replace broad substring matching with explicit patterns**

Use a small ordered rules table with word boundaries:

```ts
const CATEGORY_ALIASES: ReadonlyArray<[RegExp, string]> = [
  [/\bmonitors?\b/i, "Monitors"],
  [/\b(?:headphones?|earbuds?)\b/i, "Headphones"],
  [/\b(?:printers?|scanners?)\b/i, "Printers & Scanners"],
  [/\b(?:microphones?|mics?)\b/i, "Microphones"],
];
```

Carry the remaining existing mappings into the same table with exact word or phrase boundaries. Preserve unknown trimmed labels unchanged.

- [ ] **Step 4: Rename the fallback constant**

Rename `EQUIPMENT_CATEGORIES` to `DEFAULT_EQUIPMENT_CATEGORIES`, update its dialog import, and remove the misleading `EquipmentCategory` union if no caller uses it.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
node --import tsx --test tests/equipment-category-coverage.test.mjs tests/list-import.test.mjs
npm test
```

Expected: all tests pass and the imported row/category counts remain unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pulse.ts src/components/equipment/add-equipment-dialog.tsx tests/equipment-category-coverage.test.mjs tests/list-import.test.mjs
git commit -m "fix: harden equipment category normalization"
```

### Task 4: Simplify equipment assignment validation and preserve query errors

**Files:**

- Modify: `src/app/actions/equipment.ts:27`
- Create: `tests/equipment-actions-contract.test.mjs`

**Interfaces:**

- Consumes: one Supabase client, equipment division ID, personnel ID, and role.
- Produces: `validateAssignment(supabase, divisionId, personnelId, role): Promise<string | null>` and `findCategoryId(supabase, categoryName): Promise<{ id: string | null; error: string | null }>`.

- [ ] **Step 1: Add source-contract regression tests**

Create `tests/equipment-actions-contract.test.mjs` to read the server-action source and assert:

```js
assert.doesNotMatch(source, /categoryName:\s*"Laptop"/);
assert.match(
  source,
  /validateAssignment\(supabase, equipment\.division_id, personnelId, role\)/
);
assert.match(source, /Could not load equipment categories/);
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
node --import tsx --test tests/equipment-actions-contract.test.mjs
```

Expected: FAIL because reassignment fabricates a complete laptop input and category errors are discarded.

- [ ] **Step 3: Refactor the assignment validator**

Use one role-oriented helper:

```ts
async function validateAssignment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  divisionId: string,
  personnelId: string | null,
  role: "Custodian" | "Assignee"
) {
  if (!personnelId) return null;
  const { data: person, error } = await supabase
    .from("personnel")
    .select("plantilla_status,division_id,position")
    .eq("id", personnelId)
    .single();
  if (error || !person) return `Selected ${role} was not found.`;
  if (person.division_id !== divisionId)
    return `${role} must be within the same division.`;
  if (
    role === "Custodian" &&
    (person.plantilla_status !== "Regular" ||
      ["PSS", "PES"].includes(person.position))
  )
    return "Custodian must be Regular personnel and NOT a PSS/PES user.";
  if (role === "Assignee" && !["PSS", "PES"].includes(person.position))
    return "Assignee must be a PSS or PES user.";
  return null;
}
```

Create the Supabase client once in each server action and pass it to the helper. Validate Custodian and Assignee separately in add/update; validate only the requested role in reassignment.

- [ ] **Step 4: Return category query errors distinctly**

Change the lookup to preserve failures:

```ts
async function findCategoryId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryName: string
) {
  const { data, error } = await supabase
    .from("equipment_categories")
    .select("id")
    .eq("name", canonicalEquipmentCategory(categoryName))
    .maybeSingle();
  if (error) return { id: null, error: "Could not load equipment categories." };
  return { id: data?.id ?? null, error: null };
}
```

Return the helper error before using `Category not found.` for a successful query with no row.

- [ ] **Step 5: Run action contracts, TypeScript, and tests**

Run:

```bash
node --import tsx --test tests/equipment-actions-contract.test.mjs
npm run typecheck
npm test
```

Expected: all commands pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/actions/equipment.ts tests/equipment-actions-contract.test.mjs
git commit -m "fix: simplify equipment assignment validation"
```

### Task 5: Make aggregate notifications change-aware and actionable

**Files:**

- Modify: `src/lib/notifications.ts:33`
- Modify: `tests/live-notifications.test.mjs`

**Interfaces:**

- Consumes: the existing equipment array with stable UUIDs.
- Produces: `notificationId(kind, equipmentIds)` and filtered Equipment links.

- [ ] **Step 1: Add notification identity and link tests**

Add assertions that the same set is stable, a changed set creates another ID, and links contain filters:

```js
const first = buildNotifications(equipment, [], now);
const second = buildNotifications(
  [...equipment, replacementEquipment],
  [],
  now
);

assert.equal(first[0].id, buildNotifications(equipment, [], now)[0].id);
assert.notEqual(first[0].id, second[0].id);
assert.equal(
  first.find((item) => item.kind === "replacement")?.href,
  "/equipment?status=For+Replacement"
);
assert.equal(
  first.find((item) => item.kind === "unassigned")?.href,
  "/equipment?assignment=unassigned"
);
```

Task 6 parses the spec's `assignment=unassigned` URL parameter.

- [ ] **Step 2: Run the notification test to verify it fails**

Run:

```bash
node --import tsx --test tests/live-notifications.test.mjs
```

Expected: FAIL because IDs are currently constant and links are unfiltered.

- [ ] **Step 3: Compute IDs from affected equipment**

Add a pure helper without a new dependency:

```ts
function notificationId(kind: NotificationKind, equipmentIds: string[]) {
  return `${kind}:${[...equipmentIds].sort().join(",")}`;
}
```

Build replacement, expiring, and unassigned arrays once, then use their lengths, IDs, and filtered links. Keep the activity notification keyed by `newestActivity.id`.

- [ ] **Step 4: Run notification and full tests**

Run:

```bash
node --import tsx --test tests/live-notifications.test.mjs
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/notifications.ts tests/live-notifications.test.mjs
git commit -m "fix: refresh changed equipment notifications"
```

### Task 6: Add pure Equipment URL filter state

**Files:**

- Create: `src/lib/equipment-filters.ts`
- Create: `tests/equipment-filters.test.mjs`

**Interfaces:**

- Consumes: `URLSearchParams` or a Next.js page search-parameter record.
- Produces: `EquipmentFilters`, `parseEquipmentFilters(input)`, and `equipmentFiltersQuery(filters, category?)`.

- [ ] **Step 1: Write URL parsing and serialization tests**

Cover defaults, invalid pages/status, omission of empty values, and round trips:

```js
assert.deepEqual(parseEquipmentFilters(new URLSearchParams()), {
  q: "",
  division: "",
  brand: "",
  status: "",
  assignment: "",
  page: 1,
});

const filters = parseEquipmentFilters(
  new URLSearchParams("q=dell&status=Broken&page=2&assignment=unassigned")
);
assert.equal(
  equipmentFiltersQuery(filters, "Laptop"),
  "category=Laptop&q=dell&status=Broken&assignment=unassigned&page=2"
);
assert.equal(
  parseEquipmentFilters(new URLSearchParams("page=-1&status=Unknown")).page,
  1
);
assert.equal(
  parseEquipmentFilters(new URLSearchParams("page=-1&status=Unknown")).status,
  ""
);
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
node --import tsx --test tests/equipment-filters.test.mjs
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the pure filter module**

Define exact allowed values:

```ts
export const EQUIPMENT_FILTER_STATUSES = [
  "Active",
  "Expiring soon",
  "For Replacement",
  "Broken",
  "Retired",
] as const;
export type EquipmentFilterStatus =
  "" | (typeof EQUIPMENT_FILTER_STATUSES)[number];
export type EquipmentAssignmentFilter = "" | "unassigned";

export type EquipmentFilters = {
  q: string;
  division: string;
  brand: string;
  status: EquipmentFilterStatus;
  assignment: EquipmentAssignmentFilter;
  page: number;
};
```

Trim text values, whitelist enum values, coerce `page` to a positive integer, and serialize parameters in this order: `category`, `q`, `division`, `brand`, `status`, `assignment`, `page`. Omit page `1` and empty values.

- [ ] **Step 4: Run tests and TypeScript**

Run:

```bash
node --import tsx --test tests/equipment-filters.test.mjs
npm run typecheck
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/equipment-filters.ts tests/equipment-filters.test.mjs
git commit -m "feat: define equipment URL filter state"
```

### Task 7: Persist Equipment search, filters, and pagination

**Files:**

- Modify: `src/app/(dashboard)/equipment/page.tsx:17`
- Modify: `src/components/equipment/equipment-table.tsx:8`
- Modify: `tests/equipment-category-coverage.test.mjs`
- Modify: `tests/dashboard-style-contract.test.mjs`

**Interfaces:**

- Consumes: `EquipmentFilters`, `parseEquipmentFilters`, and `equipmentFiltersQuery` from Task 6.
- Produces: a shareable Equipment URL and one search covering asset and assignment fields.

- [ ] **Step 1: Add UI contract tests**

Assert the Equipment page passes parsed filters and the table exposes unified search, clear filters, filtered count, and native history synchronization:

```js
assert.match(pageSource, /parseEquipmentFilters/);
assert.match(tableSource, /Search serial, model, brand, custodian/);
assert.match(tableSource, /Clear filters/);
assert.match(tableSource, /window\.history\.replaceState/);
assert.match(tableSource, /Showing .* matching/);
```

- [ ] **Step 2: Run the UI contracts to verify they fail**

Run:

```bash
node --import tsx --test tests/equipment-category-coverage.test.mjs tests/dashboard-style-contract.test.mjs
```

Expected: FAIL because only local column filters exist.

- [ ] **Step 3: Parse filter defaults in the Server Component**

Extend the page type and pass filters to the table:

```ts
searchParams: Promise<{
  category?: string;
  q?: string;
  division?: string;
  brand?: string;
  status?: string;
  assignment?: string;
  page?: string;
}>;
```

Call `parseEquipmentFilters(new URLSearchParams(...))` after awaiting `searchParams`. Keep the category-only Supabase query and pass `initialFilters={filters}` to `EquipmentTable`.

- [ ] **Step 4: Add unified client-side filtering**

Add `globalFilter` and a custom `globalFilterFn` that lowercases and searches:

```ts
[
  item.serial_number,
  item.model,
  item.brand,
  item.division?.code,
  item.personnel?.full_name,
  item.assignee?.full_name,
  item.equipment_categories?.name,
]
  .filter(Boolean)
  .join(" ")
  .toLowerCase();
```

Add the `assignment=unassigned` filter using `!item.personnel && !item.assignee`. Initialize TanStack column filters and pagination from `initialFilters`.

- [ ] **Step 5: Synchronize table state to the URL**

On search/filter/page changes, call `equipmentFiltersQuery()` while preserving `category`, then update without a server request:

```ts
window.history.replaceState(
  null,
  "",
  query ? `/equipment?${query}` : "/equipment"
);
```

Reset the page index to zero before writing the URL whenever `q`, division, brand, status, or assignment changes. Keep `page` one-based in the URL and zero-based inside TanStack Table.

- [ ] **Step 6: Add filter controls and result context**

Replace “Search custodian” with the unified search. Add the assignment filter, conditional Clear filters button, and text in this exact shape:

```tsx
<span role="status">
  Showing {firstRecord}–{lastRecord} of {filteredCount} matching records
</span>
```

Add accessible labels to every input/select. Disable pagination controls at their bounds.

- [ ] **Step 7: Run focused checks and production build**

Run:

```bash
node --import tsx --test tests/equipment-filters.test.mjs tests/equipment-category-coverage.test.mjs tests/dashboard-style-contract.test.mjs tests/live-notifications.test.mjs
npm run typecheck
npm run build
```

Expected: all commands pass; notification URLs open with matching filters applied.

- [ ] **Step 8: Manually verify navigation behavior**

Run:

```bash
npm run dev
```

Verify:

1. Search for a serial, model, brand, custodian, and assignee.
2. Combine division, brand, status, and assignment filters.
3. Refresh and confirm state remains.
4. Open an equipment detail and use browser Back; confirm filters and page remain.
5. Open replacement and unassigned notification links; confirm the expected records appear.
6. Clear filters; confirm only `category` remains in the URL.

- [ ] **Step 9: Commit**

```bash
git add src/app/'(dashboard)'/equipment/page.tsx src/components/equipment/equipment-table.tsx tests/equipment-category-coverage.test.mjs tests/dashboard-style-contract.test.mjs
git commit -m "feat: persist equipment filters in the URL"
```

### Task 8: Prevent duplicate mutations in entity dialogs and equipment actions

**Files:**

- Modify: `src/components/equipment/add-equipment-dialog.tsx:13`
- Modify: `src/components/equipment/equipment-actions.tsx:11`
- Modify: `src/components/personnel/add-personnel-dialog.tsx:13`
- Modify: `src/components/divisions/add-division-dialog.tsx:11`
- Modify: `src/components/admin/user-management.tsx:20`
- Modify: `tests/dashboard-style-contract.test.mjs`

**Interfaces:**

- Consumes: existing server actions and action result objects.
- Produces: disabled pending controls, operation-specific labels, and accessible status/error feedback.

- [ ] **Step 1: Add pending-state UI contracts**

Read each component source and assert it contains a pending guard, disabled mutation control, and accessible feedback. Require the Equipment dialog to reset its add form after success.

```js
assert.match(equipmentDialog, /disabled=\{saving\}/);
assert.match(equipmentDialog, /Saving…/);
assert.match(equipmentDialog, /role="alert"/);
assert.match(equipmentActions, /disabled=\{pendingAction !== null\}/);
assert.match(personnelDialog, /disabled=\{saving\}/);
```

- [ ] **Step 2: Run the contract test to verify it fails**

Run:

```bash
node --import tsx --test tests/dashboard-style-contract.test.mjs
```

Expected: FAIL because most mutation controls currently remain active during requests.

- [ ] **Step 3: Add local pending state to dialogs**

For Equipment, Personnel, and Division dialogs:

```ts
const [saving, setSaving] = useState(false);

async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (saving) return;
  setSaving(true);
  setError("");
  try {
    const result = await action();
    if (result.error) setError(result.error);
    else setOpen(false);
  } finally {
    setSaving(false);
  }
}
```

Disable form controls or at minimum the submit button while saving. Use `Saving…`, `Creating…`, or `Updating…` according to the action. Mark errors with `role="alert"`.

In `AddEquipmentDialog`, extract the existing add defaults into `newEquipmentForm(category, divisions)`. After a successful add, call `setForm(newEquipmentForm(category, divisions))`; successful edits retain their existing initial values.

- [ ] **Step 4: Guard equipment actions independently**

Use:

```ts
type PendingEquipmentAction =
  "custodian" | "assignee" | "archive" | "state" | null;
const [pendingAction, setPendingAction] =
  useState<PendingEquipmentAction>(null);
```

Ignore new actions while one is pending, disable all mutation buttons/selects, restore optimistic state on failure, and use `role="alert"` only for errors and `role="status"` for success.

- [ ] **Step 5: Guard user-management mutations**

Track `creating`, `updatingUserId`, and `deletingUserId`. Disable only the relevant row where possible, but prevent the same action from being submitted twice. Preserve existing self-delete and last-admin safeguards.

- [ ] **Step 6: Run focused tests and TypeScript**

Run:

```bash
node --import tsx --test tests/dashboard-style-contract.test.mjs tests/temporary-password-flow.test.mjs
npm run typecheck
```

Expected: all commands pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/equipment/add-equipment-dialog.tsx src/components/equipment/equipment-actions.tsx src/components/personnel/add-personnel-dialog.tsx src/components/divisions/add-division-dialog.tsx src/components/admin/user-management.tsx tests/dashboard-style-contract.test.mjs
git commit -m "fix: prevent duplicate dashboard mutations"
```

### Task 9: Return budget cost errors inline

**Files:**

- Modify: `src/app/actions/admin.ts:81`
- Create: `src/components/budget/category-cost-form.tsx`
- Modify: `src/app/(dashboard)/budget/page.tsx:330`
- Modify: `tests/budget-page-ui.test.mjs`

**Interfaces:**

- Consumes: `saveCategoryCost(previousState, formData)` Server Action.
- Produces: `CategoryCostState = { error: string; success: boolean }` and `CategoryCostForm`.

- [ ] **Step 1: Add budget error-state UI tests**

Assert the budget page composes `CategoryCostForm`, and the component uses `useActionState`, `pending`, `role="alert"`, and `role="status"`.

- [ ] **Step 2: Run the budget test to verify it fails**

Run:

```bash
node --import tsx --test tests/budget-page-ui.test.mjs
```

Expected: FAIL because `saveCategoryCost` currently throws and the form is rendered inline by the Server Component.

- [ ] **Step 3: Consolidate the budget Server Action**

Replace `updateCategoryCost` plus the throwing wrapper with:

```ts
export type CategoryCostState = { error: string; success: boolean };

export async function saveCategoryCost(
  _previousState: CategoryCostState,
  formData: FormData
): Promise<CategoryCostState> {
  const access = await requireProfile("Admin");
  if (access.error) return { error: access.error, success: false };

  const categoryId = z.string().uuid().safeParse(formData.get("category_id"));
  const year = z.coerce
    .number()
    .int()
    .min(2000)
    .max(2100)
    .safeParse(formData.get("year"));
  const unitCost = z.coerce
    .number()
    .nonnegative()
    .safeParse(formData.get("unit_cost"));
  if (!categoryId.success || !year.success || !unitCost.success) {
    return { error: "Invalid cost values.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("category_unit_costs").upsert(
    {
      category_id: categoryId.data,
      year: year.data,
      unit_cost: unitCost.data,
    },
    { onConflict: "category_id,year" }
  );
  if (error) return { error: error.message, success: false };

  revalidatePath("/budget");
  return { error: "", success: true };
}
```

Keep all current authorization and Zod boundaries intact.

- [ ] **Step 4: Build the focused client form**

`CategoryCostForm` receives `categoryId`, `year`, and `unitCost`, binds `saveCategoryCost` with `useActionState`, disables submit while pending, and renders “Saved.” as a status or the returned error as an alert. Keep hidden `category_id` and `year` inputs.

- [ ] **Step 5: Replace inline budget forms**

Render `CategoryCostForm` only when the existing `isAdmin` check is true. Preserve the current table layout and currency input semantics.

- [ ] **Step 6: Run budget, authorization, and full checks**

Run:

```bash
node --import tsx --test tests/budget-page-ui.test.mjs tests/temporary-password-flow.test.mjs
npm run typecheck
npm test
```

Expected: all commands pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/actions/admin.ts src/components/budget/category-cost-form.tsx src/app/'(dashboard)'/budget/page.tsx tests/budget-page-ui.test.mjs
git commit -m "fix: show budget cost errors inline"
```

### Task 10: Final regression and manual acceptance pass

**Files:**

- Modify only if a check exposes a regression in files already listed above.

**Interfaces:**

- Consumes: all deliverables from Tasks 1–9.
- Produces: one verified, review-ready implementation.

- [ ] **Step 1: Run the complete automated gate**

Run:

```bash
npm run check
```

Expected: lint, TypeScript, all Node tests, domain verification, migration verification, and production build pass.

- [ ] **Step 2: Verify Admin mutation flows**

With a configured Supabase development project, verify add/edit equipment, custodian/assignee changes, condition changes, archive, personnel add/edit, division add/edit, user create/update/delete safeguards, and category cost save. Double-click each submit control once; only one mutation must be produced.

- [ ] **Step 3: Verify Viewer boundaries**

Sign in as a division-scoped Viewer and confirm no Admin mutation controls appear, direct server-action attempts remain unauthorized, and Equipment filters only operate on RLS-visible records.

- [ ] **Step 4: Verify responsive and keyboard behavior**

At mobile and desktop widths, tab through Equipment filters and mutation dialogs. Confirm every filter has an accessible name, focus remains visible, pending controls are disabled, status/error messages are announced, and tables remain horizontally usable.

- [ ] **Step 5: Review the final diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
```

Expected: only planned files are changed, no whitespace errors exist, and no generated `.next` files are tracked.

- [ ] **Step 6: Commit any acceptance-only correction**

If Step 1–5 required a correction, stage only the affected planned files and commit:

```bash
git commit -m "fix: address PULSE acceptance findings"
```

If no correction was needed, do not create an empty commit.
