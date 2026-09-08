# Budget-Style Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Budget page's visual system to every authenticated dashboard route while keeping existing data, actions, permissions, and navigation behavior unchanged.

**Architecture:** Add four small presentation primitives in `src/components/layout/` for page headers, metric cards, section panels, and empty states. Migrate route composition to those primitives in independent route groups, leaving Supabase queries, server actions, table logic, chart logic, and export logic in place. Use existing Tailwind tokens and Budget classes; do not introduce a second theme.

**Tech Stack:** Next.js 16.3.4 App Router, React 19, TypeScript, Tailwind CSS v4, lucide-react, existing shadcn primitives, Node built-in tests.

**Spec:** `docs/superpowers/specs/2026-09-08-budget-style-dashboard-design.md`

## Global Constraints

- Apply the Budget visual language only to authenticated dashboard routes; keep Login, authentication routes, Not Found, and standalone auth failure screens separate.
- Preserve existing Supabase queries, RLS assumptions, server actions, exports, filters, pagination, redirects, and URL parameters.
- Use the existing tokens `bg-canvas`, `bg-canvas-deep`, `text-paper`, `text-slate`, `text-pulse`, `text-alert`, and `border-line`.
- Use Budget geometry: `space-y-8 pb-8`, `rounded-2xl`, `border border-line`, responsive `p-5/p-6/sm:p-8`, and visible focus states.
- Do not add a UI dependency or a route-specific design system.
- Keep client components client-side and server components server-compatible.

---

### Task 1: Add shared Budget-style presentation primitives

**Files:**
- Create: `src/components/layout/page-header.tsx`
- Create: `src/components/layout/metric-card.tsx`
- Create: `src/components/layout/section-panel.tsx`
- Create: `src/components/layout/empty-state.tsx`
- Create: `tests/dashboard-style-contract.test.mjs`

**Interfaces:**
- `PageHeader` accepts `eyebrow?: React.ReactNode`, `title: React.ReactNode`, `description?: React.ReactNode`, `actions?: React.ReactNode`, and `children?: React.ReactNode`.
- `MetricCard` accepts `label`, `value`, optional `detail`, optional lucide-compatible `icon`, and `tone` values `neutral | pulse | warning | alert`.
- `SectionPanel` accepts optional `title`, `description`, `actions`, and `className`, plus arbitrary children.
- `EmptyState` accepts optional icon, title, description, and action content.

- [ ] **Step 1: Write the failing style contract test**

Read the four component files as text and assert that the shared components contain the Budget contract: `rounded-2xl`, `border-line`, `bg-canvas-deep`, `focus-visible`, and `aria-hidden`. Also assert that the route root contract is represented by `space-y-8 pb-8` in the migrated pages.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/dashboard-style-contract.test.mjs`

Expected: FAIL because the four shared component files do not exist yet.

- [ ] **Step 3: Implement the primitives**

Create server-compatible components using `cn` where useful. `PageHeader` should reproduce the Budget hero: overflow-hidden rounded panel, subtle absolute pulse glow, responsive title/actions layout, serif title, and readable description. `MetricCard` should render an icon container only when an icon is supplied and map tones to existing semantic tokens. `SectionPanel` should render an optional heading row and a rounded panel. `EmptyState` should center its content and use `text-slate` for supporting copy.

- [ ] **Step 4: Run the focused test and typecheck**

Run: `node --test tests/dashboard-style-contract.test.mjs` and `npx tsc --noEmit --pretty false`

Expected: PASS for the contract and no TypeScript errors.

- [ ] **Step 5: Commit the shared primitives**

Run: `git add src/components/layout/page-header.tsx src/components/layout/metric-card.tsx src/components/layout/section-panel.tsx src/components/layout/empty-state.tsx tests/dashboard-style-contract.test.mjs; git commit -m "feat: add shared budget style primitives"`

### Task 2: Refresh the authenticated shell and route states

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/(dashboard)/loading.tsx`
- Modify: `src/app/(dashboard)/error.tsx`
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/topbar.tsx`

**Interfaces:**
- Keep the existing `Sidebar`, `Topbar`, dashboard navigation URLs, responsive mobile navigation, and sign-out form action.
- Keep `error.tsx` as a client error boundary and preserve its retry behavior.

- [ ] **Step 1: Add shell-level assertions to `tests/dashboard-style-contract.test.mjs`**

Assert that the dashboard layout still includes `/budget`, `/summary`, and `/reports`, and that loading/error surfaces include `rounded-2xl`, `border-line`, and `bg-canvas-deep` after migration.

- [ ] **Step 2: Run the test to verify the new assertions fail**

Run: `node --test tests/dashboard-style-contract.test.mjs`

Expected: FAIL on the current loading/error or shell style markers.

- [ ] **Step 3: Implement the shell refresh**

Keep the current shell dimensions and right-aligned account controls. Update mobile navigation to use Budget-compatible pill spacing and active/focus states. Give loading and error content the same panel geometry as Budget. Ensure the main content area remains scrollable and preserves its current responsive padding.

- [ ] **Step 4: Run focused lint and test**

Run: `npx eslint 'src/app/(dashboard)/layout.tsx' 'src/app/(dashboard)/loading.tsx' 'src/app/(dashboard)/error.tsx' src/components/layout/sidebar.tsx src/components/layout/topbar.tsx --max-warnings=0` and `node --test tests/dashboard-style-contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the shell refresh**

Run: `git add 'src/app/(dashboard)/layout.tsx' 'src/app/(dashboard)/loading.tsx' 'src/app/(dashboard)/error.tsx' src/components/layout/sidebar.tsx src/components/layout/topbar.tsx tests/dashboard-style-contract.test.mjs; git commit -m "feat: align dashboard shell with budget style"`

### Task 3: Refresh Dashboard and inventory-management routes

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`
- Modify: `src/app/(dashboard)/equipment/page.tsx`
- Modify: `src/app/(dashboard)/equipment/[id]/page.tsx`
- Modify: `src/app/(dashboard)/personnel/page.tsx`
- Modify: `src/app/(dashboard)/divisions/page.tsx`
- Modify: `src/components/equipment/equipment-table.tsx`
- Modify: `src/components/personnel/personnel-table.tsx`
- Modify: `src/components/divisions/divisions-table.tsx`

**Interfaces:**
- Preserve current query shapes and typed data passed to each table/dialog.
- Preserve equipment category query parameter, personnel edit/delete behavior, division actions, and equipment detail assignment/update actions.

- [ ] **Step 1: Extend the style contract test for inventory routes**

Assert that each route imports `PageHeader` and `SectionPanel`, and that each page root contains `space-y-8 pb-8`.

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/dashboard-style-contract.test.mjs`

Expected: FAIL for the current inventory routes.

- [ ] **Step 3: Migrate the route composition**

Use `PageHeader` for titles and existing actions. Use `MetricCard` for metrics that can be derived from already-loaded arrays; do not add database requests. Wrap charts, tables, detail groups, and tabs in `SectionPanel`. Replace ad-hoc empty row text with `EmptyState` only where the current component already has an empty result. Keep table columns and action controls unchanged apart from shared spacing, surface, header, and focus classes.

- [ ] **Step 4: Run focused lint, tests, and typecheck**

Run: `npx eslint 'src/app/(dashboard)/page.tsx' 'src/app/(dashboard)/equipment/page.tsx' 'src/app/(dashboard)/equipment/[id]/page.tsx' 'src/app/(dashboard)/personnel/page.tsx' 'src/app/(dashboard)/divisions/page.tsx' src/components/equipment/equipment-table.tsx src/components/personnel/personnel-table.tsx src/components/divisions/divisions-table.tsx --max-warnings=0`; then `node --test tests/dashboard-style-contract.test.mjs`; then `npx tsc --noEmit --pretty false`.

Expected: PASS.

- [ ] **Step 5: Commit the inventory route refresh**

Run: `git add 'src/app/(dashboard)/page.tsx' 'src/app/(dashboard)/equipment/page.tsx' 'src/app/(dashboard)/equipment/[id]/page.tsx' 'src/app/(dashboard)/personnel/page.tsx' 'src/app/(dashboard)/divisions/page.tsx' src/components/equipment/equipment-table.tsx src/components/personnel/personnel-table.tsx src/components/divisions/divisions-table.tsx tests/dashboard-style-contract.test.mjs; git commit -m "feat: refresh inventory pages with budget style"`

### Task 4: Refresh Summary and Reports

**Files:**
- Modify: `src/app/(dashboard)/summary/page.tsx`
- Modify: `src/app/(dashboard)/summary/summary-content.tsx`
- Modify: `src/app/(dashboard)/reports/page.tsx`
- Modify: `src/app/(dashboard)/reports/reports-client.tsx`

**Interfaces:**
- Preserve Summary `year` and `view` query parameters and client-side navigation.
- Preserve Reports filtering, pagination, report tabs, status calculations, and export data.

- [ ] **Step 1: Extend the style contract test for reporting routes**

Assert that Summary and Reports use `PageHeader`, `MetricCard`, and `SectionPanel`, and that their table sections contain accessible captions or labelled section headings.

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/dashboard-style-contract.test.mjs`

Expected: FAIL because the reporting routes still use their older page wrappers.

- [ ] **Step 3: Migrate Summary and Reports presentation**

Move existing controls into `PageHeader` actions without changing their event handlers or URLs. Use `MetricCard` for current totals. Use `SectionPanel` around the Summary matrix, Reports filters, and Reports table. Keep client-only hooks inside client components and preserve the existing export button behavior; only restyle its placement and surrounding surfaces.

- [ ] **Step 4: Run focused lint, tests, and build**

Run: `npx eslint 'src/app/(dashboard)/summary/page.tsx' 'src/app/(dashboard)/summary/summary-content.tsx' 'src/app/(dashboard)/reports/page.tsx' 'src/app/(dashboard)/reports/reports-client.tsx' --max-warnings=0`; then `node --test tests/dashboard-style-contract.test.mjs`; then `npx tsc --noEmit --pretty false`; then `npm run build`.

Expected: PASS and the build includes `/summary` and `/reports`.

- [ ] **Step 5: Commit the reporting route refresh**

Run: `git add 'src/app/(dashboard)/summary/page.tsx' 'src/app/(dashboard)/summary/summary-content.tsx' 'src/app/(dashboard)/reports/page.tsx' 'src/app/(dashboard)/reports/reports-client.tsx' tests/dashboard-style-contract.test.mjs; git commit -m "feat: refresh reporting pages with budget style"`

### Task 5: Refresh Admin routes

**Files:**
- Modify: `src/app/(dashboard)/admin/page.tsx`
- Modify: `src/app/(dashboard)/admin/users/page.tsx`
- Modify: `src/components/admin/user-management.tsx`

**Interfaces:**
- Preserve admin-only redirects, invite action payloads, role options, division scope options, and save behavior.

- [ ] **Step 1: Extend the style contract test for Admin routes**

Assert that both Admin routes use `PageHeader` and `SectionPanel`, and that the user table remains horizontally scrollable.

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/dashboard-style-contract.test.mjs`

Expected: FAIL on the current one-line Admin wrappers and management markup.

- [ ] **Step 3: Migrate Admin presentation**

Use `PageHeader` for Admin and Admin / Users. Place the user-management invite form in a responsive `SectionPanel`; place the user list in another `SectionPanel` with the Budget table treatment. Keep forms and server-action calls intact and add labels/focus states where the current controls are unlabeled.

- [ ] **Step 4: Run focused lint, tests, and typecheck**

Run: `npx eslint 'src/app/(dashboard)/admin/page.tsx' 'src/app/(dashboard)/admin/users/page.tsx' src/components/admin/user-management.tsx --max-warnings=0`; then `node --test tests/dashboard-style-contract.test.mjs`; then `npx tsc --noEmit --pretty false`.

Expected: PASS.

- [ ] **Step 5: Commit the Admin refresh**

Run: `git add 'src/app/(dashboard)/admin/page.tsx' 'src/app/(dashboard)/admin/users/page.tsx' src/components/admin/user-management.tsx tests/dashboard-style-contract.test.mjs; git commit -m "feat: refresh admin pages with budget style"`

### Task 6: Final validation and visual handoff

**Files:**
- Modify only files identified by validation output; do not reformat unrelated dirty-worktree files.

- [ ] **Step 1: Run all repository tests**

Run: `node --test tests/*.test.mjs`

Expected: PASS for the existing tests, including the Budget UI test and the new dashboard style contract test.

- [ ] **Step 2: Run TypeScript and production build**

Run: `npx tsc --noEmit --pretty false` and `npm run build`

Expected: PASS with all authenticated dashboard routes generated or recognized by the build.

- [ ] **Step 3: Run changed-file lint and inspect known baseline lint noise**

Run ESLint with `--max-warnings=0` over every changed route/component file. If a full `npm run lint` still reports unrelated pre-existing errors, record those separately and do not weaken the new route checks.

- [ ] **Step 4: Check whitespace and route responses**

Run: `git diff --check`; start the production server bound to `0.0.0.0`; request `/`, `/equipment`, `/personnel`, `/divisions`, `/budget`, `/summary`, `/reports`, and `/admin/users` without a session and verify each returns the expected authentication redirect rather than a server error.

- [ ] **Step 5: Perform the authenticated visual smoke test**

Open each in-scope route with the existing Admin session and check desktop plus narrow viewport behavior: Budget-style hero, consistent panel radius, readable hierarchy, wrapping actions, table scrolling, visible focus states, and no loss of edit/delete/export/filter behavior.

- [ ] **Step 6: Commit final validation fixes**

If the final checks require corrections, stage each corrected file by its exact path and commit with `git commit -m "chore: verify dashboard visual refresh"`. If no corrections are needed, leave the validation commits from Tasks 1–5 as the final history.
