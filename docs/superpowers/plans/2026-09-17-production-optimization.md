# PULSE Production Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make PULSE faster and more resilient while preserving authenticated data isolation and the existing user experience.

**Architecture:** Keep authenticated inventory, activity, and presence request-scoped and private. Cache only serialized, authorization-scoped server data; stream the shell before notification data; move search and activity reads onto bounded/indexed paths. Centralize production headers, metadata, and environment requirements.

**Tech Stack:** Next.js 16.3.4 App Router, React 19, Supabase SSR/JS, PostgreSQL RPCs, Tailwind CSS, Node test runner.

**Spec:** Existing workspace audit and the `nextjs-production`, App Router, caching, Supabase Auth, API security, Postgres, and testing guidance.

## Global Constraints

- Preserve private authenticated responses; never add public browser caching to user or inventory data.
- Keep service-role usage server-only and authorization checks in server code/RLS.
- Keep `01 EUMB ICT List.xlsx` and `(New) EUMB ICT SEMI-EX SERIAL NOs.xlsx` unmodified and uncommitted.
- Use test-first changes for behavior and SQL contracts; run the failing test before implementation.
- Keep `unstable_cache` only where a safe migration to `use cache` would alter route behavior; document any retained boundary.

---

### Task 1: Add optimization regression contracts

**Files:**
- Create: `tests/production-optimization.test.mjs`

- [x] **Step 1: Write tests** for configurable dev origins, security headers, noindex metadata, topbar Suspense, explicit activity columns, profile error logging, search indexes, and removal of the unbounded legacy notification reader.
- [x] **Step 2: Run `npm test`** and confirm the new assertions fail because the contracts are not implemented.

### Task 2: Harden config, metadata, environment documentation, and accessibility

**Files:**
- Modify: `next.config.ts`
- Modify: `src/app/layout.tsx`
- Modify: `.env.example`
- Modify: `src/components/layout/topbar.tsx`

- [x] **Step 1:** Make `allowedDevOrigins` read `PULSE_ALLOWED_DEV_ORIGINS` and default to an empty list; add safe baseline security headers and disable the powered-by header.
- [x] **Step 2:** Add global `robots: { index: false, follow: false }` metadata for the authenticated system.
- [x] **Step 3:** Document that `SUPABASE_SERVICE_ROLE_KEY` is required for dashboard snapshots, cached reference data, activity, presence, and admin operations.
- [x] **Step 4:** Add accessible names to icon-only profile and sign-out controls.
- [x] **Step 5:** Run the focused optimization test, typecheck, and lint.

### Task 3: Stream the dashboard shell and consolidate notification caching

**Files:**
- Create: `src/components/layout/topbar-skeleton.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/lib/cached-data.ts`

- [x] **Step 1:** Add a topbar skeleton matching the header geometry.
- [x] **Step 2:** Wrap the asynchronous Topbar in `Suspense` so navigation renders before notification data resolves.
- [x] **Step 3:** Remove the unused legacy `getCachedNotifications` path that reads the entire equipment table; keep the bounded RPC-backed notification snapshot as the only notification cache.
- [x] **Step 4:** Run focused tests and confirm no caller references the removed export.

### Task 4: Improve profile and admin activity read paths

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/admin-activity.ts`

- [x] **Step 1:** Log profile lookup errors with structured fields instead of silently converting database failures into an unregistered account.
- [x] **Step 2:** Select only activity columns needed by `toRecord` and fetch one extra row instead of an exact count to determine `hasMore`.
- [x] **Step 3:** Make Auth user listing page through Supabase Auth pages so last-sign-in data remains correct beyond 1,000 users.
- [x] **Step 4:** Run focused tests, typecheck, and lint.

### Task 5: Add indexed search paths

**Files:**
- Create: `supabase/migrations/20260917010000_add_search_indexes.sql`
- Modify: `tests/production-optimization.test.mjs`

- [x] **Step 1:** Add `pg_trgm` and trigram indexes for equipment and personnel search columns.
- [x] **Step 2:** Replace concatenated search predicates in the equipment/personnel RPCs with indexed per-column `ILIKE` predicates while preserving filters, authorization, ordering, and row bounds.
- [x] **Step 3:** Run the SQL contract test and `npx supabase db lint --linked` if the linked project is available; do not push the migration automatically.

### Task 6: Verify all gates and record the change

**Files:**
- Modify: `src/components/changelog/changelog.tsx`

- [x] **Step 1:** Add a changelog entry describing the production optimization work.
- [x] **Step 2:** Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run verify:pulse`, `npm run verify:migration`, `npm run verify:performance`, `npm run build`, `npm audit --omit=dev`, and `git diff --check` sequentially.
- [x] **Step 3:** Review the diff and ensure no workbook or secret is staged.
