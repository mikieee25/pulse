# PULSE Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the PULSE equipment-management workflow enough for the documented phases to be usable, data-safe, and buildable.

**Architecture:** Keep the existing Next.js App Router and Supabase structure. Put mutations in typed server actions, lifecycle calculations in a shared library, and keep route pages focused on data loading and composition. Use the existing shadcn-style components and visual tokens.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase SSR, PostgreSQL/RLS, React Hook Form, Zod, TanStack Table, Recharts, SheetJS, Tailwind.

**Spec:** `pulse-system-plan.md` and `pulse-tasks.md`

## Global Constraints

- Assign equipment only to `Regular` personnel.
- Preserve the current same-division assignment constraint.
- Do not import `Laptop only` or `Sheet1`.
- Do not fabricate blank workbook values.
- Keep destructive deletion Admin-only and explicit.
- Verify with fresh lint and build output before claiming completion.

### Task 1: Shared domain helpers and migration correctness

**Files:**
- Create: `src/lib/pulse.ts`
- Modify: `scripts/migrate.ts`
- Modify: `supabase/seed.sql`
- Modify: `package.json`
- Test: `scripts/verify-migration.ts`

- [x] Add lifecycle/status and safe normalization helpers.
- [x] Fix workbook header aliases, division aliases, report counts, blank-row reporting, and unmatched-custodian reporting.
- [x] Add a read-only migration verification script that checks workbook/seed counts and year preservation.
- [x] Add a runnable script entry and run the verification.

### Task 2: Database mutation and authentication foundations

**Files:**
- Create: `src/app/actions/auth.ts`
- Create: `src/app/auth/login/route.ts`
- Create: `src/app/auth/logout/route.ts`
- Create: `src/middleware.ts`
- Modify: `src/app/actions/equipment.ts`
- Modify: `src/app/actions/personnel.ts`
- Modify: `supabase/migrations/20260907052726_init.sql`

- [x] Add typed add/edit/reassign/retire/delete actions with role checks delegated to RLS and input validation.
- [x] Maintain assignment history in reassign operations.
- [x] Add login/logout handlers and redirect unauthenticated dashboard requests.
- [x] Add policies needed for safe history visibility and self-user reads.

### Task 3: Equipment and personnel workflows

**Files:**
- Create: `src/components/equipment/equipment-actions.tsx`
- Modify: `src/app/(dashboard)/equipment/page.tsx`
- Modify: `src/app/(dashboard)/equipment/[id]/page.tsx`
- Modify: `src/components/equipment/add-equipment-dialog.tsx`
- Modify: `src/components/equipment/equipment-table.tsx`
- Modify: `src/components/equipment/columns.tsx`
- Modify: `src/app/(dashboard)/personnel/page.tsx`
- Modify: `src/components/personnel/add-personnel-dialog.tsx`
- Modify: `src/app/actions/personnel.ts`

- [x] Add computed lifecycle statuses, complete equipment form, filters, and row actions.
- [x] Add assignment-history timeline and detail actions.
- [x] Make personnel division/status/initials fields spec-compliant.
- [x] Show assigned equipment in personnel records.

### Task 4: Dashboard, budget, reports, and admin routes

**Files:**
- Create: `src/app/(dashboard)/reports/page.tsx`
- Create: `src/app/(dashboard)/admin/page.tsx`
- Create: `src/app/(dashboard)/admin/users/page.tsx`
- Create: `src/app/(dashboard)/loading.tsx`
- Create: `src/app/(dashboard)/error.tsx`
- Modify: `src/app/(dashboard)/page.tsx`
- Modify: `src/app/(dashboard)/budget/page.tsx`
- Modify: `src/app/(dashboard)/divisions/page.tsx`
- Modify: `src/components/equipment/export-button.tsx`
- Modify: `src/components/layout/topbar.tsx`

- [x] Add live expiry KPI and replacement-plan data.
- [x] Replace fake budget costs with database costs and editable Admin controls.
- [x] Add current-inventory Excel/CSV reports.
- [x] Add Admin user management shell and route.
- [x] Add shared loading/error states and expired division rollups.

### Task 5: Verification

- [x] Run migration verification.
- [x] Run lint.
- [x] Run production build.
- [x] Inspect git diff and summarize any deployment-only checks.
